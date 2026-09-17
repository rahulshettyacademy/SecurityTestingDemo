import { loginAs } from "../helpers/auth";
import { api } from "../helpers/testClient";

describe("V01B - Broken Access Control: vertical privilege escalation", () => {
  test("a CUSTOMER cannot list all users", async () => {
    const token = await loginAs("rahul");
    const res = await api.get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("an ADMIN can list all users", async () => {
    const token = await loginAs("admin");
    const res = await api.get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  test("an unauthenticated request is rejected", async () => {
    const res = await api.get("/api/admin/users");
    expect(res.status).toBe(401);
  });
});
