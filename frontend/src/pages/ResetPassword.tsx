import { FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api/client";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";

  const [email, setEmail] = useState("");
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const result = await api.post<{ message: string; devToken?: string }>("/password-reset/request", { email });
      setMessage(result.devToken ? `${result.message} (training token: ${result.devToken})` : result.message);
      if (result.devToken) {
        setToken(result.devToken);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to request reset");
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const result = await api.post<{ message: string }>("/password-reset/confirm", { token, newPassword });
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reset password");
    }
  }

  return (
    <div className="auth-page">
      <h1>Reset Password</h1>

      <section>
        <h2>1. Request a reset link</h2>
        <form onSubmit={handleRequest} className="form">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button type="submit">Request reset</button>
        </form>
      </section>

      <section>
        <h2>2. Set a new password</h2>
        <form onSubmit={handleConfirm} className="form">
          <label>
            Reset token
            <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit">Reset password</button>
        </form>
      </section>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
