import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.fill("#email", "demo@moodly.app");
await page.fill("#password", "demo123");
await page.locator("button[type=submit]").click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1800);

await page.screenshot({ path: "/tmp/moodly-dashboard.png", fullPage: true });
console.log("URL after login:", page.url());

const petButtons = await page
  .locator("button[aria-label]")
  .evaluateAll((els) =>
    els.map((e) => ({ label: e.getAttribute("aria-label"), cls: e.className.slice(0, 90) })),
  );
console.log("Buttons with aria-label:", JSON.stringify(petButtons, null, 1));
console.log("Console errors:", errors.slice(0, 5));

await browser.close();
