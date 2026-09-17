import { api } from "../helpers/testClient";

describe("V06B - Debug endpoint is removed", () => {
  test("GET /api/debug/config no longer exists", async () => {
    const res = await api.get("/api/debug/config");
    expect(res.status).toBe(404);
  });
});
