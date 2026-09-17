import { api } from "../helpers/testClient";

describe("V02 - SQL Injection: product search is parameterized", () => {
  test("a lone quote is treated as literal data, not a SQL syntax error", async () => {
    const res = await api.get("/api/products/search").query({ name: "test'" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("a tautology/comment injection payload matches nothing (treated as a literal string)", async () => {
    const res = await api.get("/api/products/search").query({ name: "x' OR '1'='1' -- " });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("normal search still returns matching products", async () => {
    const res = await api.get("/api/products/search").query({ name: "iphone" });
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].name.toLowerCase()).toContain("iphone");
  });
});
