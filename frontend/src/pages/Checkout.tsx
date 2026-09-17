import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { OrderDetail } from "../api/types";
import { useCart } from "../context/CartContext";

export function Checkout() {
  const { items, clear } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  async function handlePlaceOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const order = await api.post<OrderDetail>("/orders", {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: Number(item.product.price),
        })),
      });
      clear();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return <p>Your cart is empty.</p>;
  }

  return (
    <div>
      <h1>Checkout</h1>
      <ul>
        {items.map((item) => (
          <li key={item.product.id}>
            {item.product.name} x {item.quantity} — ₹
            {(Number(item.product.price) * item.quantity).toLocaleString("en-IN")}
          </li>
        ))}
      </ul>
      <p className="cart-total">Total: ₹{total.toLocaleString("en-IN")}</p>
      {error && <p className="error-text">{error}</p>}
      <button onClick={handlePlaceOrder} disabled={submitting}>
        {submitting ? "Placing order..." : "Place order"}
      </button>
    </div>
  );
}
