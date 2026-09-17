import { api } from "./testClient";

export const CREDENTIALS = {
  rahul: { email: "rahul@test.com", password: "Rahul123!" },
  priya: { email: "priya@test.com", password: "Priya123!" },
  admin: { email: "admin@test.com", password: "Admin123!" },
};

export async function loginAs(user: keyof typeof CREDENTIALS): Promise<string> {
  const { email, password } = CREDENTIALS[user];
  const res = await api.post("/api/auth/login").send({ email, password });
  if (res.status !== 200 || !res.body.token) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token as string;
}
