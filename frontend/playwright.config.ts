import { defineConfig, devices } from "@playwright/test";

// Test này chỉ điều khiển trình duyệt nhắm vào frontend đang chạy sẵn — nó
// KHÔNG tự dựng stack (frontend + backend + chatbot). Trước khi chạy
// `npm run test:e2e`, phải tự khởi động cả 3 service (native `npm run dev`
// từng service, hoặc `docker compose -f docker-compose.dev.yml up -d`).
// baseURL có thể override qua biến môi trường PLAYWRIGHT_BASE_URL.
// QUAN TRỌNG: mọi output của Playwright (report, test-results, storageState)
// phải nằm NGOÀI thư mục frontend/ — docker-compose.dev.yml bind-mount
// nguyên frontend/ vào container và Vite dev server watch/serve toàn bộ thư
// mục đó. Nếu để playwright-report/ hay test-results/ nằm trong frontend/,
// Vite sẽ cố transform các file đó (kể cả .html/.svg) như source, gây lỗi
// 500 lan sang cả các route thật của app (đã tận mắt gặp: /sign-in bị lỗi
// "Internal server error" ngay sau khi chạy `npx playwright test` một lần).
export default defineConfig({
  testDir: "./test/e2e",
  outputDir: "../.playwright-output/test-results",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "../.playwright-output/report", open: "never" }]],
  globalSetup: "./test/e2e/global-setup.ts",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    storageState: "../.playwright-output/.auth/user.json",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "booking-manual",
      testMatch: /booking-manual\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      // /doctors bắn nhiều request song song khi mount; trên DB dev cục bộ
      // (connection pool nhỏ, không dành riêng cho test) độ trễ có lúc vượt
      // hẳn 30s mặc định — xem comment trong booking-manual.spec.ts.
      timeout: 60_000,
      retries: 1,
    },
    {
      name: "booking-chatbot",
      testMatch: /booking-chatbot\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      // Luồng chatbot gọi LLM thật qua LangGraph (nhiều node/round-trip),
      // độ trễ cao và không hoàn toàn deterministic dù temperature: 0 — chấp
      // nhận thêm 1 lần retry thay vì cố ép ổn định tuyệt đối.
      retries: 1,
      timeout: 120_000,
    },
  ],
});
