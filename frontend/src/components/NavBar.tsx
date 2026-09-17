import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export function NavBar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/products" className="brand">
        RSA SecureShop
      </Link>
      <div className="nav-links">
        <Link to="/products">Products</Link>
        {user && <Link to="/orders">My Orders</Link>}
        {user && <Link to="/cart">Cart ({cartCount})</Link>}
        {user && <Link to="/profile">Profile</Link>}
        {user?.role === "ADMIN" && <Link to="/admin">Admin</Link>}
        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && (
          <button className="link-button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
