"""Provider contract tests. No live credentials or network connections are used."""

import io
import os
import unittest
from contextlib import ExitStack, redirect_stdout
from unittest.mock import call, patch
from urllib.parse import parse_qs, urlsplit

import nonproduction as ci


def branch(name, branch_id, parent_id="br-root"):
    return {
        "id": branch_id,
        "name": name,
        "project_id": "test-neon",
        "parent_id": parent_id,
        "protected": False,
        "default": False,
    }


ROOT = branch("aquario-synthetic", "br-root", None)
CURRENT = branch("aq-ci-pr-23-r100-1", "br-new")
PREVIOUS = branch("aq-ci-pr-23-r99-1", "br-old")
OTHER = branch("aq-ci-pr-231-r99-1", "br-other")
URI = "postgresql://neondb_owner:local%40test@localhost/neondb"
SHA = "a" * 40
SETTINGS = {
    "MODE": "preview",
    "NONPROD_NEON_PROJECT_ID": "test-neon",
    "PRODUCTION_NEON_PROJECT_ID": "live-neon",
    "PRODUCTION_VERCEL_PROJECT_ID": "live-vercel",
    "STAGING_VERCEL_PROJECT_ID": "stage-vercel",
    "PREVIEW_VERCEL_PROJECT_ID": "preview-vercel",
    "NONPROD_NEON_API_KEY": "synthetic-neon-key",
    "NONPROD_VERCEL_TOKEN": "synthetic-vercel-token",
    "NONPROD_VERCEL_ORG_ID": "team-test",
    "PR_NUMBER": "23",
    "GITHUB_RUN_ID": "100",
    "GITHUB_RUN_ATTEMPT": "1",
    "PR_HEAD_REF": "topic/example",
    "PR_HEAD_SHA": SHA,
    "GITHUB_REPOSITORY_ID": "123",
}
PROJECT = {
    "id": "preview-vercel",
    "name": "test",
    "link": {"repoId": 123, "productionBranch": "main"},
}

BINDING = {
    "key": "DATABASE_URL",
    "type": "sensitive",
    "target": ["preview"],
    "gitBranch": "topic/example",
    "id": "managed",
    "comment": "Aquario CI aq-ci-pr-23-r100-1",
}
STORED = {"created": BINDING, "failed": []}
NO_BINDINGS = {"envs": []}
CURRENT_BINDING = {"envs": [BINDING]}


class NonproductionTests(unittest.TestCase):
    def setUp(self):
        stack = ExitStack()
        self.addCleanup(stack.close)
        stack.enter_context(patch.dict(os.environ, SETTINGS, clear=True))
        self.network = stack.enter_context(
            patch.object(
                ci, "request", side_effect=AssertionError("unexpected network call")
            )
        )

    def test_incomplete_or_shared_configuration_makes_zero_requests(self):
        for key in SETTINGS:
            with (
                self.subTest(key=key),
                patch.dict(os.environ, {key: ""}),
                self.assertRaises((KeyError, ValueError)),
            ):
                ci.deploy_preview()
        for dest, shared in [
            ("NONPROD_NEON_PROJECT_ID", "live-neon"),
            ("PREVIEW_VERCEL_PROJECT_ID", "stage-vercel"),
            ("STAGING_VERCEL_PROJECT_ID", "live-vercel"),
        ]:
            with (
                self.subTest(dest=dest),
                patch.dict(os.environ, {dest: shared}),
                self.assertRaises(ValueError),
            ):
                ci.deploy_preview()
        self.network.assert_not_called()

    def test_uses_empty_root_and_rotates_only_child_role_before_returning_masked_uri(
        self,
    ):
        with (
            patch.object(
                ci,
                "neon",
                side_effect=[
                    {"branches": [], "pagination": {"next": "next-page"}},
                    {"branches": [ROOT]},
                    {"branch": CURRENT, "operations": [{"id": "op-create"}]},
                    {"operation": {"status": "finished"}},
                    {
                        "role": {
                            "branch_id": "br-new",
                            "name": "neondb_owner",
                            "password": "local@test",
                        },
                        "operations": [{"id": "op-reset"}],
                    },
                    {"operation": {"status": "finished"}},
                    {"uri": URI},
                ],
            ) as neon,
            redirect_stdout(io.StringIO()) as logs,
        ):
            self.assertEqual(ci.prepare_database(), URI)
        calls = neon.call_args_list
        self.assertIn("cursor=next-page", calls[1].args[0])
        self.assertEqual(
            calls[2],
            call(
                "/branches",
                "POST",
                {
                    "branch": {
                        "name": CURRENT["name"],
                        "parent_id": ROOT["id"],
                        "init_source": "parent-schema",
                    },
                    "endpoints": [{"type": "read_write"}],
                },
            ),
        )
        self.assertEqual(
            calls[4], call("/branches/br-new/roles/neondb_owner/reset_password", "POST")
        )
        self.assertEqual(
            parse_qs(urlsplit(calls[-1].args[0]).query)["branch_id"], ["br-new"]
        )
        self.assertEqual(
            logs.getvalue().splitlines(),
            [
                "::add-mask::local@test",
                "::add-mask::local%2540test",
                "::add-mask::" + URI.replace("%", "%25"),
            ],
        )

    def test_missing_or_nested_template_and_shared_project_stop_provisioning(self):
        for template in (
            [],
            [dict(ROOT, parent_id="production")],
            [dict(ROOT, project_id="other")],
        ):
            with (
                self.subTest(template=template),
                patch.object(ci, "neon", return_value={"branches": template}) as neon,
            ):
                with self.assertRaises(ValueError):
                    ci.prepare_database()
                self.assertEqual(neon.call_count, 1)

    def test_previous_role_password_is_never_exported(self):
        with (
            patch.object(
                ci,
                "neon",
                side_effect=[
                    {"branches": [ROOT]},
                    {"branch": CURRENT},
                    {
                        "role": {
                            "branch_id": "br-new",
                            "name": "neondb_owner",
                            "password": "rotated",
                        }
                    },
                    {"uri": URI},
                    {"branches": [ROOT, CURRENT]},
                    {},
                ],
            ) as neon,
            redirect_stdout(io.StringIO()) as logs,
        ):
            with self.assertRaisesRegex(ValueError, "invalid database URI"):
                ci.prepare_database()
            self.assertEqual(logs.getvalue(), "")
            self.assertEqual(
                neon.call_args_list[-1], call("/branches/br-new", "DELETE")
            )

    def test_password_reset_failure_discards_only_new_database(self):
        with patch.object(
            ci,
            "neon",
            side_effect=[
                {"branches": [ROOT, PREVIOUS]},
                {"branch": CURRENT},
                RuntimeError("reset failed"),
                {"branches": [ROOT, CURRENT, PREVIOUS, OTHER]},
                {},
            ],
        ) as neon:
            with self.assertRaisesRegex(RuntimeError, "reset failed"):
                ci.prepare_database()
            self.assertEqual(
                neon.call_args_list[-1], call("/branches/br-new", "DELETE")
            )
            self.assertFalse(
                any("/connection_uri" in c.args[0] for c in neon.call_args_list)
            )

    def test_cleanup_preserves_other_prs_and_legacy_branches(self):
        rows = [
            ROOT,
            CURRENT,
            PREVIOUS,
            OTHER,
            branch("staging", "legacy-db", "legacy-main"),
        ]
        for operation, deleted in [
            ("failed", ["br-new"]),
            ("previous", ["br-old"]),
            ("all", ["br-new", "br-old"]),
        ]:
            with (
                self.subTest(operation=operation),
                patch.object(
                    ci, "neon", side_effect=[{"branches": rows}] + [{}] * len(deleted)
                ) as neon,
            ):
                ci.remove_branches(operation)
                self.assertEqual(
                    neon.call_args_list[1:],
                    [call("/branches/" + i, "DELETE") for i in deleted],
                )

    def test_cleanup_refuses_unexpected_lineage_or_protected_database(self):
        for guard in [
            {"protected": True},
            {"default": True},
            {"parent_id": "unexpected"},
            {"project_id": "other"},
        ]:
            with (
                self.subTest(guard=guard),
                patch.object(
                    ci,
                    "neon",
                    return_value={"branches": [ROOT, dict(CURRENT, **guard)]},
                ) as neon,
            ):
                with self.assertRaises(ValueError):
                    ci.remove_branches("all")
                self.assertEqual(neon.call_count, 1)

    def test_remote_builder_gets_branch_database_and_exact_git_commit(self):
        with (
            patch.object(
                ci,
                "vercel",
                side_effect=[
                    PROJECT,
                    NO_BINDINGS,
                    STORED,
                    {"id": "dpl"},
                    {"readyState": "READY", "url": "preview-test.vercel.app"},
                    CURRENT_BINDING,
                    {},
                ],
            ) as vercel,
            patch.object(ci, "prepare_database", return_value=URI),
            patch.object(ci, "write_output") as output,
        ):
            ci.deploy_preview()
        _, _, env = vercel.call_args_list[2].args
        self.assertEqual(
            (env["gitBranch"], env["target"], env["type"], env["value"]),
            ("topic/example", ["preview"], "sensitive", URI),
        )
        self.assertEqual(vercel.call_args_list[2].kwargs, {})
        self.assertEqual(vercel.call_args_list[3].kwargs, {"forceNew": "1"})
        _, _, deploy = vercel.call_args_list[3].args
        self.assertEqual(
            deploy["gitSource"],
            {"type": "github", "repoId": "123", "ref": "topic/example", "sha": SHA},
        )
        self.assertNotIn("synthetic-vercel-token", repr(deploy))
        self.assertIn("prisma db seed", deploy["projectSettings"]["buildCommand"])
        output.assert_called_once_with("url", "https://preview-test.vercel.app")

    def test_preview_rollback_across_both_providers(self):
        for failure in (
            [ci.ProviderError("api.vercel.com", 400)],
            [{"id": "dpl"}, {"readyState": "ERROR"}],
            [{"id": "dpl"}, {"readyState": "CANCELED"}],
        ):
            with (
                self.subTest(failure=failure),
                patch.object(
                    ci,
                    "vercel",
                    side_effect=[
                        PROJECT,
                        NO_BINDINGS,
                        STORED,
                        *failure,
                        CURRENT_BINDING,
                        {},
                    ],
                ) as vercel,
                patch.object(ci, "prepare_database", return_value=URI),
                patch.object(
                    ci,
                    "neon",
                    side_effect=[
                        {"branches": [ROOT, CURRENT, PREVIOUS, OTHER]},
                        {},
                    ],
                ) as neon,
            ):
                with self.assertRaises(RuntimeError):
                    ci.deploy_preview()
                self.assertEqual(
                    vercel.call_args_list[-1],
                    call("/v9/projects/preview-vercel/env/managed", "DELETE"),
                )
                self.assertEqual(
                    neon.call_args_list[1:], [call("/branches/br-new", "DELETE")]
                )

    def test_operator_binding_is_preserved_before_allocating_database(self):
        for manual in (
            dict(BINDING, comment="manual"),
            dict(BINDING, target=["preview", "development"]),
        ):
            with (
                self.subTest(manual=manual),
                patch.object(
                    ci, "vercel", side_effect=[PROJECT, {"envs": [manual]}]
                ) as vercel,
                patch.object(ci, "prepare_database") as db,
            ):
                with self.assertRaisesRegex(ValueError, "another owner"):
                    ci.deploy_preview()
                db.assert_not_called()
                self.assertEqual(vercel.call_count, 2)

    def test_conflict_during_env_creation_preserves_new_operator_binding(self):
        manual = dict(BINDING, comment="manual")
        with (
            patch.object(
                ci,
                "vercel",
                side_effect=[
                    PROJECT,
                    NO_BINDINGS,
                    {"failed": [{"error": "conflict"}]},
                    {"envs": [manual]},
                ],
            ) as vercel,
            patch.object(ci, "prepare_database", return_value=URI),
            patch.object(ci, "remove_branches") as remove,
        ):
            with self.assertRaisesRegex(RuntimeError, "environment variable"):
                ci.deploy_preview()
            self.assertEqual(vercel.call_count, 4)
            remove.assert_called_once_with("failed")

    def test_lost_deployment_response_resumes_only_the_matching_attempt(self):
        marker = BINDING["comment"]
        deployments = [
            {"uid": "other", "meta": {"aquarioAttempt": "other"}},
            {"uid": "mine", "meta": {"aquarioAttempt": marker}},
        ]
        with (
            patch.object(
                ci,
                "vercel",
                side_effect=[
                    PROJECT,
                    NO_BINDINGS,
                    STORED,
                    TimeoutError(),
                    {"deployments": deployments},
                    {"readyState": "READY", "url": "mine.vercel.app"},
                    CURRENT_BINDING,
                    {},
                ],
            ) as vercel,
            patch.object(ci, "prepare_database", return_value=URI),
            patch.object(ci, "write_output") as output,
        ):
            ci.deploy_preview()
            self.assertIn(call("/v13/deployments/mine"), vercel.call_args_list)
            output.assert_called_once_with("url", "https://mine.vercel.app")

    def test_unconfirmed_deployment_preserves_its_database_and_binding(self):
        with (
            patch.object(
                ci,
                "vercel",
                side_effect=[
                    PROJECT,
                    NO_BINDINGS,
                    STORED,
                    TimeoutError(),
                    {"deployments": []},
                ],
            ),
            patch.object(ci, "prepare_database", return_value=URI),
            patch.object(ci, "remove_branches") as remove,
        ):
            with self.assertRaisesRegex(RuntimeError, "Unconfirmed deployment"):
                ci.deploy_preview()
            remove.assert_not_called()

    def test_lost_neon_create_response_reclaims_only_matching_child(self):
        with patch.object(
            ci,
            "neon",
            side_effect=[
                {"branches": [ROOT, PREVIOUS]},
                TimeoutError(),
                {"branches": [ROOT, PREVIOUS, CURRENT, OTHER]},
                {},
            ],
        ) as neon:
            with self.assertRaises(TimeoutError):
                ci.prepare_database()
            self.assertEqual(
                neon.call_args_list[-1], call("/branches/br-new", "DELETE")
            )

    def test_limit_allows_updates_but_refuses_a_ninth_pr(self):
        branches = [
            ROOT,
            *[branch(f"aq-ci-pr-{n}-r42-1", f"br-{n}") for n in range(1, 9)],
        ]
        with patch.object(ci, "neon", return_value={"branches": branches}) as neon:
            with self.assertRaisesRegex(ValueError, "limit reached"):
                ci.prepare_database()
            self.assertEqual(neon.call_count, 1)
        with (
            patch.dict(os.environ, {"PR_NUMBER": "1"}),
            patch.object(
                ci,
                "neon",
                side_effect=[
                    {"branches": branches},
                    TimeoutError(),
                    {"branches": branches},
                ],
            ) as neon,
        ):
            with self.assertRaises(TimeoutError):
                ci.prepare_database()
            self.assertEqual(neon.call_args_list[1].args[:2], ("/branches", "POST"))

    def test_closing_pr_removes_only_its_own_environment_entry(self):
        env = {
            "key": "DATABASE_URL",
            "gitBranch": "topic/example",
            "id": "managed",
            "target": ["preview"],
            "comment": "Aquario CI aq-ci-pr-23",
        }
        with (
            patch.object(
                ci,
                "vercel",
                side_effect=[
                    PROJECT,
                    {
                        "envs": [
                            env,
                            dict(env, id="manual", comment="manual"),
                            dict(env, id="other", gitBranch="other"),
                        ]
                    },
                    {},
                ],
            ) as vercel,
            patch.object(ci, "remove_branches") as remove,
        ):
            ci.deploy_preview(cleanup=True)
            remove.assert_called_once_with("all")
            self.assertEqual(
                vercel.call_args_list[-1],
                call("/v9/projects/preview-vercel/env/managed", "DELETE"),
            )
