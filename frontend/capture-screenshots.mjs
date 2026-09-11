import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const OUTPUT_DIR = path.resolve("../docs/screenshots/patient");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function run() {
  console.log("Launching Chromium browser at 1440x900 (HiDPI)...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Pre-acknowledge disclaimer so it doesn't block home landing page
  await page.addInitScript(() => {
    localStorage.setItem(
      "lifehealth_educational_disclaimer_ack",
      JSON.stringify({
        acknowledged: true,
        expiry: Date.now() + 30 * 24 * 60 * 60 * 1000,
      })
    );
  });

  console.log("1. Authenticating as patient dinhthikieuoanh@gmail.com...");
  await page.goto("http://localhost:5173/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.fill('input[name="usernameOrEmail"]', "dinhthikieuoanh@gmail.com");
  await page.fill('input[name="password"]', "123456");
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  console.log("Current URL after login:", page.url());

  // 1. Dashboard
  console.log("Capturing dashboard.png...");
  await page.goto("http://localhost:5173/patient", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "dashboard.png"),
    fullPage: false,
  });

  // 2. Doctor Discovery
  console.log("Capturing doctor-list.png...");
  await page.goto("http://localhost:5173/doctors", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "doctor-list.png"),
    fullPage: false,
  });

  // 3. Quick Booking Dialog
  console.log("Interacting for quick-booking.png...");
  const quickBookBtn = page.locator('button:has-text("Đặt lịch nhanh")').first();
  if (await quickBookBtn.isVisible()) {
    await quickBookBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "quick-booking.png"),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
  }

  // 4. Doctor Detail & Booking Confirmation Modal
  console.log("Capturing doctor-profile.png...");
  await page.goto("http://localhost:5173/doctors/8", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "doctor-profile.png"),
    fullPage: false,
  });

  console.log("Interacting for booking.png (selecting future date & slot)...");
  try {
    const dayButtons = page.locator('button[name="day"]:not([disabled]), .rdp-day:not([disabled])');
    const count = await dayButtons.count();
    if (count > 2) {
      await dayButtons.nth(Math.min(count - 1, 5)).click();
      await page.waitForTimeout(1000);
    }

    const enabledSlot = page.locator('button:not([disabled]):has-text(":")').first();
    if (await enabledSlot.isVisible()) {
      await enabledSlot.click();
      await page.waitForTimeout(800);
      const confirmBtn = page.locator('button:has-text("Tiếp tục xác nhận đặt lịch")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(1200);
      }
    }
  } catch (e) {
    console.log("Slot selection interaction note:", e.message);
  }
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "booking.png"),
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // 5. Appointments Page
  console.log("Capturing appointments.png...");
  await page.goto("http://localhost:5173/patient/appointments", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "appointments.png"),
    fullPage: false,
  });

  // 6. Health Records (with populated medical metrics)
  console.log("Capturing health-records.png...");
  await page.goto("http://localhost:5173/patient/health-records", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const relativePill = page.locator('button:has-text("Đinh Văn Sáu")').first();
  if (await relativePill.isVisible()) {
    await relativePill.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "health-records.png"),
    fullPage: false,
  });

  // 7. Messaging (scroll down slightly so composer is fully visible)
  console.log("Capturing messaging.png...");
  await page.goto("http://localhost:5173/patient/messages?channelId=11", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  // Ensure message container is scrolled to bottom
  await page.evaluate(() => {
    window.scrollBy(0, 160);
  });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "messaging.png"),
    fullPage: false,
  });

  // 8. Profile
  console.log("Capturing profile.png...");
  await page.goto("http://localhost:5173/patient/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "profile.png"),
    fullPage: false,
  });

  // 9. Home Landing Page
  console.log("Capturing home.png...");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  // Dismiss disclaimer if still present
  const disclaimerBtn = page.locator('button:has-text("Tôi đã hiểu & Tiếp tục trải nghiệm")');
  if (await disclaimerBtn.isVisible()) {
    await disclaimerBtn.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "home.png"),
    fullPage: false,
  });

  // 10. MedAI Chatbot (navigate client-side to preserve user state)
  console.log("Capturing ai-consultation.png via client navigation...");
  const chatbotLink = page.locator('a:has-text("LifeHealth MedAI")').first();
  if (await chatbotLink.isVisible()) {
    await chatbotLink.click();
    await page.waitForTimeout(2500);
  } else {
    await page.goto("http://localhost:5173/chatbot", { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
  }
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "ai-consultation.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Screenshot capture error:", err);
  process.exit(1);
});
