import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { OrderDetail as OrderDetailType } from "../api/types";

export function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setOrder(null);
    api
      .get<OrderDetailType>(`/orders/${orderId}`)
      .then(setOrder)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load order"));
  }, [orderId]);

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!order) {
    return <p>Loading order...</p>;
  }

  return (
    <div>
      <h1>Order #{order.id}</h1>
      <p>Status: {order.status}</p>
      <p>Placed on: {new Date(order.created_at).toLocaleString()}</p>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit price</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.product_name}</td>
              <td>{item.quantity}</td>
              <td>₹{Number(item.unit_price).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cart-total">Total: ₹{Number(order.total_amount).toLocaleString("en-IN")}</p>
    </div>
  );
}
