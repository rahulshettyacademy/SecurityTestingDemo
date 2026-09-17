import { loginAs } from "../helpers/auth";
import { api, pool } from "../helpers/testClient";

describe("V07 - Insecure Design: checkout uses the authoritative database price", () => {
  const PRODUCT_ID = 6; // Mechanical Keyboard, seeded at 3499.00

  afterEach(async () => {
    // Restore the stock this test consumes so the suite is safe to re-run.
    await pool.query("UPDATE products SET stock = stock + 1 WHERE id = $1", [PRODUCT_ID]);
  });

  test("a tampered client-supplied price is ignored; the real DB price is charged", async () => {
    const token = await loginAs("rahul");

    const productRes = await api.get(`/api/products/${PRODUCT_ID}`);
    const realPrice = Number(productRes.body.price);
    expect(realPrice).toBeGreaterThan(1);

    const orderRes = await api
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ productId: PRODUCT_ID, quantity: 1, price: 1 }] });

    expect(orderRes.status).toBe(201);
    expect(Number(orderRes.body.total_amount)).toBe(realPrice);
    expect(Number(orderRes.body.total_amount)).not.toBe(1);
  });
});
