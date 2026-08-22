/**
 * @jest-environment node
 */
import { __resetOpenApiCacheForTests, getOpenApiDocument } from "../generator";

describe("SIGAA OpenAPI contract", () => {
  beforeEach(() => {
    __resetOpenApiCacheForTests();
  });

  it("documents strict reauthentication with the normal bearer and closed responses", () => {
    const operation = getOpenApiDocument().paths?.["/usuarios/me/sigaa/reauth"]?.post;

    expect(operation).toBeDefined();
    expect(operation?.security).toEqual([{ bearerAuth: [] }]);
    expect(Object.keys(operation?.responses ?? {})).toEqual([
      "200",
      "400",
      "401",
      "403",
      "429",
      "503",
    ]);
    expect(operation?.requestBody).toBeDefined();
  });

  it("registers the request, response, and SIGAA error codes", () => {
    const schemas = getOpenApiDocument().components?.schemas ?? {};

    expect(schemas).toHaveProperty("SigaaReauthRequest");
    expect(schemas).toHaveProperty("SigaaReauthResponse");
    expect(JSON.stringify(schemas.ErrorCode)).toContain("SIGAA_REAUTH_FAILED");
    expect(JSON.stringify(schemas.ErrorCode)).toContain("SIGAA_REAUTH_UNAVAILABLE");
  });
});
