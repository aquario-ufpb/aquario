import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { test as setup } from "@playwright/test";
import { createStudentToken, STORAGE_STATE } from "./session";

// One account and one login per run; every test starts from this stored session in a fresh browser
// context, so the login rate limit is never reached no matter how many tests run.
setup("sign in a new student", async ({ request }, testInfo) => {
  const token = await createStudentToken(request);
  const { baseURL } = testInfo.project.use;
  await mkdir(dirname(STORAGE_STATE), { recursive: true });
  await writeFile(
    STORAGE_STATE,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: new URL(String(baseURL)).origin,
          localStorage: [{ name: "token", value: token }],
        },
      ],
    })
  );
});
