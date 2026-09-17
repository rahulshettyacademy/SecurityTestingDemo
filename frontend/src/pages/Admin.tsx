import { Link } from "react-router-dom";

export function Admin() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome to the RSA SecureShop administration area.</p>
      <ul>
        <li>
          <Link to="/admin/users">User Management</Link>
        </li>
      </ul>
    </div>
  );
}
