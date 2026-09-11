/**
 * Chạy MỘT LẦN sau toàn bộ integration test suite. Cố tình KHÔNG drop
 * database test — giữ lại giúp lần chạy sau nhanh hơn (migration re-run là
 * no-op nhờ TypeORM tự bookkeeping trong bảng `migrations`). Không có kết
 * nối/pool toàn cục nào cần đóng ở đây vì mỗi test file tự mở/đóng app của
 * riêng nó (xem test-app.factory.ts).
 */
export default async function globalTeardown(): Promise<void> {
  // no-op — xem giải thích ở trên.
}
