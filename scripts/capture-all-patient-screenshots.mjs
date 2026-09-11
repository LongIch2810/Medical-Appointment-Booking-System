import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const OUTPUT_DIR = path.resolve("docs/screenshots/patient");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function run() {
  console.log("Launching Chromium browser...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log("1. Logging in as patient dinhthikieuoanh@gmail.com...");
  await page.goto("http://localhost:5173/sign-in", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.fill('input[name="usernameOrEmail"]', "dinhthikieuoanh@gmail.com");
  await page.fill('input[name="password"]', "123456");
  await page.click('button[type="submit"]');

  // Wait for login redirection or storage update
  await page.waitForTimeout(3000);
  console.log("Current URL after login attempt:", page.url());

  // 1. Dashboard
  console.log("Capturing dashboard.png...");
  await page.goto("http://localhost:5173/patient", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "dashboard.png"),
    fullPage: false,
  });

  // 2. Doctor Discovery & Quick Booking
  console.log("Capturing doctor-list.png...");
  await page.goto("http://localhost:5173/doctors", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "doctor-list.png"),
    fullPage: false,
  });

  console.log("Interacting for quick-booking.png...");
  const quickBookBtn = page.locator('button:has-text("Đặt lịch nhanh")').first();
  if (await quickBookBtn.isVisible()) {
    await quickBookBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "quick-booking.png"),
      fullPage: false,
    });
    // Close dialog by clicking Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  } else {
    console.log("Quick book button not found!");
  }

  // 3. Doctor Detail & Booking Confirmation Modal
  console.log("Capturing doctor-profile.png...");
  await page.goto("http://localhost:5173/doctors/8", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "doctor-profile.png"),
    fullPage: false,
  });

  console.log("Interacting for booking.png (appointment confirmation modal)...");
  // Look for schedule slots
  const slotBtn = page.locator('button:has-text("08:00"), button:has-text("09:30"), button:has-text("14:00"), button:has-text("15:30")').first();
  if (await slotBtn.isVisible()) {
    await slotBtn.click();
    await page.waitForTimeout(800);
    const confirmBtn = page.locator('button:has-text("Tiếp tục xác nhận đặt lịch")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "booking.png"),
        fullPage: false,
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  } else {
    // If no specific slot visible, screenshot the booking calendar area
    console.log("No specific slot button found, capturing calendar view as booking.png...");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "booking.png"),
      fullPage: false,
    });
  }

  // 4. Appointments Page
  console.log("Capturing appointments.png...");
  await page.goto("http://localhost:5173/patient/appointments", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "appointments.png"),
    fullPage: false,
  });

  // 5. Health Records
  console.log("Capturing health-records.png...");
  await page.goto("http://localhost:5173/patient/health-records", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "health-records.png"),
    fullPage: false,
  });

  // 6. Messaging
  console.log("Capturing messaging.png...");
  await page.goto("http://localhost:5173/patient/messages", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  // Click first channel if available
  const firstChannel = page.locator('.channel-item, [role="button"], li').first();
  if (await firstChannel.isVisible()) {
    try {
      await firstChannel.click();
      await page.waitForTimeout(1000);
    } catch {}
  }
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "messaging.png"),
    fullPage: false,
  });

  // 7. Profile
  console.log("Capturing profile.png...");
  await page.goto("http://localhost:5173/patient/profile", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "profile.png"),
    fullPage: false,
  });

  // 8. Home Landing Page
  console.log("Capturing home.png...");
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "home.png"),
    fullPage: false,
  });

  // 9. MedAI Chatbot
  console.log("Capturing ai-consultation.png...");
  await page.goto("http://localhost:5173/chatbot", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
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
