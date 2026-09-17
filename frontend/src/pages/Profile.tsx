import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "../api/client";
import { User } from "../api/types";

export function Profile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<User>("/profile").then((data) => {
      setProfile(data);
      setName(data.name);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const updated = await api.put<User>("/profile", { name });
      setProfile(updated);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update profile");
    }
  }

  if (!profile) {
    return <p>Loading profile...</p>;
  }

  return (
    <div>
      <h1>My Profile</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={profile.email} disabled />
        </label>
        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <button type="submit">Save changes</button>
      </form>
    </div>
  );
}
