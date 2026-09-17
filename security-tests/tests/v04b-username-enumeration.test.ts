import { api } from "../helpers/testClient";

describe("V04B - Username enumeration via login error messages", () => {
  test("an unknown email and a known email with a wrong password return the identical generic message", async () => {
    const unknown = await api
      .post("/api/auth/login")
      .send({ email: "definitely-not-a-real-user@test.com", password: "whatever123" });
    const wrongPassword = await api.post("/api/auth/login").send({ email: "priya@test.com", password: "wrongpassword123" });

    expect(unknown.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(unknown.body.error).toBe("Invalid email or password");
    expect(wrongPassword.body.error).toBe("Invalid email or password");
  });
});
