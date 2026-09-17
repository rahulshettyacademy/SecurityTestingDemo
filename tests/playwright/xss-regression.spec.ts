import { expect, test } from "@playwright/test";

// V03 - Stored XSS in product reviews. This is a frontend-only rendering
// bug (the backend stores review comments unmodified on both branches), so
// unlike the other vulnerabilities this regression test cannot be a
// Supertest API test - it needs a real browser to prove the payload either
// does or does not execute. See security-tests/README.md for why the other
// nine vulnerabilities are tested there instead.

const API_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:5000/api";
const PRODUCT_ID = 4; // Smart Watch Series 5
const XSS_PAYLOAD = `<img src=x onerror="alert('Security Training Demo')">`;

test("stored XSS payload in a review renders as inert text, not executable markup", async ({ page }) => {
  const email = `xss-regression-${Date.now()}@test.com`;

  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "XSS Regression Test", email, password: "TestPass123!" }),
  });
  const { token } = (await registerRes.json()) as { token: string };

  await fetch(`${API_URL}/products/${PRODUCT_ID}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: XSS_PAYLOAD }),
  });

  // On the vulnerable branch this payload pops a real alert() dialog when
  // the page renders. Playwright's dialog handler lets us safely detect
  // (and dismiss) that instead of hanging the test - if this fires at all,
  // the vulnerability is present and the assertion below fails the test.
  let dialogFired = false;
  page.on("dialog", async (dialog) => {
    dialogFired = true;
    await dialog.dismiss();
  });

  await page.goto(`/products/${PRODUCT_ID}`);

  // The payload must appear as literal, visible text...
  await expect(page.getByText(XSS_PAYLOAD)).toBeVisible();

  // ...and must never have been parsed into a real <img> element.
  await expect(page.locator('img[src="x"]')).toHaveCount(0);

  expect(dialogFired).toBe(false);
});
