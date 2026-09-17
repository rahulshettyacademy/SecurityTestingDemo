import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export function Cart() {
  const { items, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();
  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div>
        <h1>Your cart is empty</h1>
        <Link to="/products">Browse products</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Shopping Cart</h1>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.product.id}>
              <td>{item.product.name}</td>
              <td>₹{Number(item.product.price).toLocaleString("en-IN")}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  max={item.product.stock}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.product.id, Math.max(1, Number(e.target.value)))}
                />
              </td>
              <td>₹{(Number(item.product.price) * item.quantity).toLocaleString("en-IN")}</td>
              <td>
                <button className="link-button" onClick={() => removeItem(item.product.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cart-total">Total: ₹{total.toLocaleString("en-IN")}</p>
      <button onClick={() => navigate("/checkout")}>Proceed to checkout</button>
    </div>
  );
}
