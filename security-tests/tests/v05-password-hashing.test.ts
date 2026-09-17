import { api, pool } from "../helpers/testClient";

describe("V05 - Passwords are hashed, never stored in plaintext", () => {
  const testEmail = `security-test-v05-${Date.now()}@test.com`;
  const testPassword = "SuperSecret123!";

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  test("a newly registered user's password is stored as a bcrypt hash", async () => {
    const registerRes = await api
      .post("/api/auth/register")
      .send({ name: "Security Test", email: testEmail, password: testPassword });
    expect(registerRes.status).toBe(201);

    const dbResult = await pool.query("SELECT password FROM users WHERE email = $1", [testEmail]);
    const storedPassword: string = dbResult.rows[0].password;

    expect(storedPassword).not.toBe(testPassword);
    expect(storedPassword).toMatch(/^\$2[aby]\$/);
  });

  test("login still succeeds against the hashed password", async () => {
    const loginRes = await api.post("/api/auth/login").send({ email: testEmail, password: testPassword });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });
});
