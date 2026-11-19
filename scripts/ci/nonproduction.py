"""Provision disposable Neon databases and deploy PR commits on Vercel's builders."""

import json
import os
import re
import sys
import time
from urllib.error import HTTPError
from urllib.parse import quote, unquote, urlencode, urlsplit
from urllib.request import Request, urlopen


def required(key):
    value = os.environ.get(key, "")
    if not value or "\n" in value or "\r" in value:
        raise ValueError(f"Missing or invalid setting: {key}")
    return value


def check_project(name):
    if name == "VERCEL":
        projects = {
            mode: required(f"{mode.upper()}_VERCEL_PROJECT_ID")
            for mode in ("preview", "staging", "production")
        }
        if len(set(projects.values())) != len(projects):
            raise ValueError(
                "Preview, staging and production must use distinct Vercel projects"
            )
        return projects[required("MODE")]
    project = required(f"NONPROD_{name}_PROJECT_ID")
    if project == required(f"PRODUCTION_{name}_PROJECT_ID"):
        raise ValueError(f"{name} nonproduction project must differ from production")
    return project


def request(url, token, method="GET", body=None):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    data = None if body is None else json.dumps(body).encode()
    try:
        with urlopen(
            Request(url, data, headers, method=method), timeout=30
        ) as response:
            raw = response.read()
        return json.loads(raw) if raw else {}
    except HTTPError as error:
        # A provider error body can contain credentials or environment values.
        raise RuntimeError(
            f"{urlsplit(url).hostname} returned HTTP {error.code}"
        ) from None


def mask(value):
    if not value or "\r" in value or "\n" in value:
        raise ValueError("Invalid secret returned by provider")
    print("::add-mask::" + value.replace("%", "%25"), flush=True)


def neon(path, method="GET", body=None):
    project = quote(check_project("NEON"), safe="")
    url = f"https://console.neon.tech/api/v2/projects/{project}{path}"
    return request(url, required("NONPROD_NEON_API_KEY"), method, body)


def vercel(path, method="GET", body=None, **params):
    query = urlencode({"teamId": required("NONPROD_VERCEL_ORG_ID"), **params})
    return request(
        f"https://api.vercel.com{path}?{query}",
        required("NONPROD_VERCEL_TOKEN"),
        method,
        body,
    )


def wait_neon(response):
    for op in response.get("operations", []):
        operation_id = quote(op["id"], safe="")
        for _ in range(60):
            status = neon(f"/operations/{operation_id}")["operation"]["status"]
            if status in {"finished", "skipped"}:
                break
            if status in {"failed", "error", "cancelled", "cancelling"}:
                raise RuntimeError(f"Neon operation failed ({status})")
            time.sleep(2)
        else:
            raise TimeoutError("Neon operation timed out")


def branch_name():
    mode = required("MODE")
    if mode == "staging":
        return "aq-ci-staging"
    if mode != "preview":
        raise ValueError("Unknown deployment mode")
    number = required("PR_NUMBER")
    if not re.fullmatch(r"[1-9][0-9]*", number):
        raise ValueError("Invalid PR number")
    return f"aq-ci-pr-{number}"


def deployment_suffix():
    parts = [required("GITHUB_RUN_ID"), required("GITHUB_RUN_ATTEMPT")]
    if any(not re.fullmatch(r"[1-9][0-9]*", part) for part in parts):
        raise ValueError("Invalid workflow run identifier")
    return "-r" + "-".join(parts)


def managed_branches():
    project = check_project("NEON")
    branches = []
    cursor = None
    while True:
        args = {"limit": 100}
        if cursor:
            args["cursor"] = cursor
        page = neon("/branches?" + urlencode(args))
        branches.extend(page["branches"])
        cursor = page.get("pagination", {}).get("next")
        if not cursor:
            break
    template = next((b for b in branches if b["name"] == "aquario-synthetic"), None)
    if not template or template["project_id"] != project or template.get("parent_id"):
        raise ValueError("Missing synthetic root in the isolated Neon project")
    return template, branches


def remove_branches(which):
    template, branches = managed_branches()
    group = branch_name()
    current = group + deployment_suffix()
    for branch in branches:
        if not re.fullmatch(
            re.escape(group) + r"-r[1-9][0-9]*-[1-9][0-9]*", branch["name"]
        ):
            continue
        if which == "failed" and branch["name"] != current:
            continue
        if which == "previous" and branch["name"] == current:
            continue
        if (
            branch.get("parent_id") != template["id"]
            or branch["project_id"] != template["project_id"]
            or branch["default"]
            or branch["protected"]
        ):
            raise ValueError("Refusing to remove a branch outside the synthetic root")
        wait_neon(neon("/branches/" + quote(branch["id"], safe=""), "DELETE"))


def prepare_database():
    template, branches = managed_branches()
    project = template["project_id"]
    group = branch_name()
    name = group + deployment_suffix()
    if required("MODE") == "preview":
        active_prs = {
            b["name"].split("-r")[0]
            for b in branches
            if b.get("parent_id") == template["id"]
            and re.fullmatch(
                r"aq-ci-pr-[1-9][0-9]*-r[1-9][0-9]*-[1-9][0-9]*", b["name"]
            )
        }
        if group not in active_prs and len(active_prs) >= 8:
            raise ValueError(
                "Preview database limit reached; close an unused PR and retry."
            )
    created = neon(
        "/branches",
        "POST",
        {
            "branch": {
                "name": name,
                "parent_id": template["id"],
                "init_source": "parent-schema",
            },
            "endpoints": [{"type": "read_write"}],
        },
    )
    child = created["branch"]
    if (
        child["project_id"] != project
        or child.get("parent_id") != template["id"]
        or child["name"] != name
        or child["id"] == template["id"]
    ):
        raise ValueError("Unexpected branch returned by Neon")
    try:
        wait_neon(created)
        child_id = quote(child["id"], safe="")
        # Children of unprotected Neon branches can inherit the parent's role password.
        wait_neon(
            neon(f"/branches/{child_id}/roles/neondb_owner/reset_password", "POST")
        )
        args = urlencode(
            {
                "branch_id": child["id"],
                "database_name": "neondb",
                "role_name": "neondb_owner",
            }
        )
        uri = neon("/connection_uri?" + args)["uri"]
        parsed = urlsplit(uri)
        if (
            parsed.scheme not in {"postgres", "postgresql"}
            or not parsed.password
            or not parsed.hostname
        ):
            raise ValueError("Neon returned an invalid database URI")
        # Mask both forms because clients can log either the encoded or decoded password.
        for value in dict.fromkeys([unquote(parsed.password), parsed.password, uri]):
            mask(value)
        return uri
    except Exception:
        remove_branches("failed")
        raise


def preview_metadata():
    project = check_project("VERCEL")
    required("NONPROD_VERCEL_TOKEN")
    required("NONPROD_VERCEL_ORG_ID")
    ref = required("PR_HEAD_REF")
    sha = required("PR_HEAD_SHA")
    repo_id = required("GITHUB_REPOSITORY_ID")
    if not re.fullmatch(r"[a-f0-9]{40}", sha) or not repo_id.isdecimal():
        raise ValueError("Invalid Git source")
    info = vercel("/v9/projects/" + quote(project, safe=""))
    if (
        info["id"] != project
        or str(info["link"]["repoId"]) != repo_id
        or ref == (info["link"].get("productionBranch") or "main")
    ):
        raise ValueError(
            "Expected the isolated Vercel project linked to this repository and a preview branch"
        )
    return info, {"type": "github", "repoId": repo_id, "ref": ref, "sha": sha}


def deploy_preview(cleanup=False):
    # Validate all required configuration before the first request to either provider.
    check_project("NEON")
    required("NONPROD_NEON_API_KEY")
    branch_name()
    deployment_suffix()
    project, source = preview_metadata()
    project_id = quote(project["id"], safe="")
    env_path = f"/v10/projects/{project_id}/env"
    marker = f"Aquario CI {branch_name()}"
    if cleanup:
        remove_branches("all")
        for item in vercel(env_path, gitBranch=source["ref"], target="preview")["envs"]:
            if (
                item.get("gitBranch") == source["ref"]
                and item.get("comment") == marker
                and item["key"] == "DATABASE_URL"
            ):
                vercel(
                    f"/v9/projects/{project_id}/env/" + quote(item["id"], safe=""),
                    "DELETE",
                )
        return
    uri = prepare_database()
    vercel(
        env_path,
        "POST",
        {
            "key": "DATABASE_URL",
            "value": uri,
            "type": "sensitive",
            "target": ["preview"],
            "gitBranch": source["ref"],
            "comment": marker,
        },
        upsert="true",
    )
    created = vercel(
        "/v13/deployments",
        "POST",
        {
            "name": project["name"],
            "project": project["id"],
            "gitSource": source,
            "projectSettings": {
                "buildCommand": "npx prisma migrate deploy && npx prisma db seed && npm run build"
            },
        },
        forceNew="1",
    )
    deployment_id = quote(created["id"], safe="")
    for _ in range(120):
        status = vercel("/v13/deployments/" + deployment_id)
        if status["readyState"] == "READY":
            host = status["url"]
            if not re.fullmatch(r"[a-z0-9-]+\.vercel\.app", host):
                raise ValueError("Unexpected preview hostname")
            write_output("url", "https://" + host)
            return
        if status["readyState"] in {"ERROR", "CANCELED"}:
            remove_branches("failed")
            raise RuntimeError(f"Vercel preview build {status['readyState']}")
        time.sleep(10)
    raise TimeoutError("Preview build timed out")


def write_output(key, value):
    if "\n" in value or "\r" in value:
        raise ValueError("Invalid workflow output")
    with open(required("GITHUB_OUTPUT"), "a", encoding="utf-8") as output:
        output.write(f"{key}={value}\n")


if __name__ == "__main__":
    mode = required("MODE")
    operation = sys.argv[1] if len(sys.argv) == 2 else "deploy"
    if operation in {"failed", "previous"}:
        remove_branches(operation)
    elif mode == "staging":
        check_project("VERCEL")
        write_output("url", prepare_database())
    elif mode == "preview":
        deploy_preview(cleanup=required("PR_ACTION") == "closed")
    else:
        sys.exit("Unknown deployment mode")
