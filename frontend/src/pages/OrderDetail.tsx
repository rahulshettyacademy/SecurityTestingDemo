import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { OrderDetail as OrderDetailType } from "../api/types";
import { useAuth } from "../context/AuthContext";

export function OrderDetail() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setOrder(null);
    api
      .get<OrderDetailType>(`/orders/${orderId}`)
      .then((data) => {
        // Only show the order if it belongs to the logged-in user (admins can see any order).
        if (user && data.user_id !== user.id && user.role !== "ADMIN") {
          setError("You do not have access to this order");
          return;
        }
        setOrder(data);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load order"));
  }, [orderId, user]);

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
