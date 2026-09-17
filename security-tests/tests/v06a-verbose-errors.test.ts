import { api } from "../helpers/testClient";

describe("V06A/V06C - Error responses never leak stack traces or DB details", () => {
  test("an unhandled error (integer out of Postgres range) returns only a generic message", async () => {
    // 99999999999 is a syntactically valid number but exceeds Postgres's
    // integer range, so the database itself throws - independent of V02,
    // this proves the error handler's fix on its own.
    const res = await api.get("/api/products/99999999999");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Something went wrong. Please try again later." });
    expect(res.body.stack).toBeUndefined();
    expect(res.body.name).toBeUndefined();
    expect(res.body.code).toBeUndefined();
  });
});
