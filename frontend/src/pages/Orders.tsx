import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { OrderSummary } from "../api/types";

export function Orders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<OrderSummary[]>("/orders")
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading orders...</p>;
  }

  if (orders.length === 0) {
    return (
      <div>
        <h1>My Orders</h1>
        <p>You have not placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>My Orders</h1>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Status</th>
            <th>Total</th>
            <th>Placed on</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>{order.status}</td>
              <td>₹{Number(order.total_amount).toLocaleString("en-IN")}</td>
              <td>{new Date(order.created_at).toLocaleDateString()}</td>
              <td>
                <Link to={`/orders/${order.id}`}>View details</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
