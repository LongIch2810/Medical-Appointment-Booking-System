import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { SEED_PATIENT } from "./fixtures/testData";

// process.cwd() (không dùng __dirname) để tương thích cả khi file này chạy
// dưới dạng ESM — package.json của frontend khai báo "type": "module".
// `npm run test:e2e` luôn chạy với cwd = frontend/. Đường dẫn phải khớp
// use.storageState trong playwright.config.ts — cố ý đặt NGOÀI frontend/
// (xem comment trong playwright.config.ts: tránh Vite dev server trong
// container Docker watch/serve nhầm các file output của Playwright).
const AUTH_FILE = path.resolve(
  process.cwd(),
  "../.playwright-output/.auth/user.json"
);

// Đăng nhập 1 lần qua UI thật trước khi chạy toàn bộ test suite, lưu
// storageState (cookie accessToken/refreshToken httpOnly + localStorage) để
// mọi spec dùng lại.
//
// Bắt buộc phải đăng nhập qua UI (không gọi thẳng API /auth/login bằng
// request context) — useUserStore (frontend/src/store/useUserStore.ts) dùng
// zustand `persist` xuống localStorage, chỉ được set khi chạy qua mutation
// useLogin() thật trong trình duyệt. Nếu chỉ set cookie qua API mà bỏ qua UI,
// cookie vẫn hợp lệ (đủ để gọi API) nhưng userInfo trong localStorage vẫn
// null — mọi route có guard client-side dựa vào userInfo (vd /chatbot, xem
// Chatbot.tsx: `if (!userInfo) navigate("/sign-in")`) sẽ tự động điều hướng
// ngược lại /sign-in ngay sau khi mount, khiến các phần tử trên trang bị
// unmount giữa chừng (Playwright báo "element was detached from the DOM").
export default async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  await page.goto("/sign-in");
  await page
    .locator('input[name="usernameOrEmail"]')
    .fill(SEED_PATIENT.usernameOrEmail);
  await page.locator('input[name="password"]').fill(SEED_PATIENT.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/sign-in"), {
    timeout: 20_000,
  });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  await browser.close();
}
