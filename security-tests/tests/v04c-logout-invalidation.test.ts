import { loginAs } from "../helpers/auth";
import { api } from "../helpers/testClient";

describe("V04C - Logout invalidates the session token", () => {
  test("a token replayed after logout is rejected", async () => {
    const token = await loginAs("rahul");

    const beforeLogout = await api.get("/api/orders").set("Authorization", `Bearer ${token}`);
    expect(beforeLogout.status).toBe(200);

    const logoutRes = await api.post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);

    const replay = await api.get("/api/orders").set("Authorization", `Bearer ${token}`);
    expect(replay.status).toBe(401);
  });
});
