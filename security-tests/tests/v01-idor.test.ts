import { loginAs } from "../helpers/auth";
import { api } from "../helpers/testClient";

describe("V01 - Broken Access Control: IDOR on order lookup", () => {
  test("Rahul cannot access Priya's order (1002)", async () => {
    const token = await loginAs("rahul");
    const res = await api.get("/api/orders/1002").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("Rahul can access his own order (1001)", async () => {
    const token = await loginAs("rahul");
    const res = await api.get("/api/orders/1001").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1001);
  });

  test("Priya cannot access Rahul's order (1001)", async () => {
    const token = await loginAs("priya");
    const res = await api.get("/api/orders/1001").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("an admin override can access any order (intentional, role-checked)", async () => {
    const token = await loginAs("admin");
    const res = await api.get("/api/orders/1002").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
