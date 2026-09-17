import { api } from "../helpers/testClient";

describe("V04A - Login rate limiting", () => {
  test("more than 5 failed login attempts in a minute are throttled with 429", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      // eslint-disable-next-line no-await-in-loop
      const res = await api
        .post("/api/auth/login")
        .send({ email: "rate-limit-test@test.com", password: "wrong-password" });
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 5).every((status) => status === 401)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});
