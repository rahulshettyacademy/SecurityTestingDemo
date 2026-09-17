import { Request, Response } from "express";
import { pool } from "../db/pool";

interface CheckoutItem {
  productId: number;
  quantity: number;
  price?: number; // client-supplied price; must never be trusted server-side
}

export async function listOrders(req: Request, res: Response): Promise<void> {
  const result = await pool.query(
    "SELECT id, status, total_amount, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user!.userId]
  );
  res.json(result.rows);
}

export async function getOrderById(req: Request, res: Response): Promise<void> {
  const orderId = parseInt(req.params.orderId, 10);
  if (Number.isNaN(orderId)) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }

  const orderResult = await pool.query(
    "SELECT id, user_id, status, total_amount, created_at FROM orders WHERE id = $1",
    [orderId]
  );

  if (orderResult.rowCount === 0) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const order = orderResult.rows[0];

  // SECURITY-LAB-VULNERABILITY: V01 - Broken Access Control (Insecure Direct Object Reference)
  // This handler checks that the caller is authenticated (see authenticate middleware
  // in orderRoutes.ts) but never verifies that order.user_id matches req.user.userId.
  // Any logged-in customer can read any other customer's order by changing the
  // numeric :orderId in the URL, e.g. GET /api/orders/1002 while logged in as Rahul.

  const itemsResult = await pool.query(
    `SELECT oi.id, oi.product_id, p.name AS product_name, oi.quantity, oi.unit_price
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  res.json({ ...order, items: itemsResult.rows });
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const { items } = req.body as { items?: CheckoutItem[] };

  if (!items || items.length === 0) {
    res.status(400).json({ error: "At least one item is required" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let totalAmount = 0;
    const lineItems: { productId: number; quantity: number; unitPrice: number }[] = [];

    for (const item of items) {
      const productResult = await client.query(
        "SELECT id, price, stock FROM products WHERE id = $1 FOR UPDATE",
        [item.productId]
      );

      if (productResult.rowCount === 0) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const product = productResult.rows[0];
      const quantity = Math.max(1, Math.floor(item.quantity));

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      // SECURITY-LAB-VULNERABILITY: V07 - Insecure Design (client-controlled price)
      // The unit price is taken from the request body (item.price) whenever
      // the client supplies one, instead of always using product.price from
      // the database. A tampered request such as
      // {"productId":6,"quantity":1,"price":1} lets the caller name their
      // own price for a real product - the server still validates that the
      // product exists and has stock, but not that the price is legitimate.
      const unitPrice = item.price !== undefined ? Number(item.price) : Number(product.price);
      totalAmount += unitPrice * quantity;
      lineItems.push({ productId: product.id, quantity, unitPrice });

      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [quantity, product.id]);
    }

    const orderResult = await client.query(
      "INSERT INTO orders (user_id, status, total_amount, created_at) VALUES ($1, 'PAID', $2, NOW()) RETURNING id, status, total_amount, created_at",
      [req.user!.userId, totalAmount]
    );
    const order = orderResult.rows[0];

    for (const line of lineItems) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [order.id, line.productId, line.quantity, line.unitPrice]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ ...order, items: lineItems });
  } catch (err) {
    await client.query("ROLLBACK");
    const message = err instanceof Error ? err.message : "Unable to create order";
    res.status(400).json({ error: message });
  } finally {
    client.release();
  }
}
