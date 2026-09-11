# LifeHealth — AS-IS specification

Tài liệu này mô tả trạng thái hiện tại của repository tại thời điểm khảo sát, dựa trên source code, cấu hình, migration, test và route đang có. Đây là đặc tả hiện trạng, không phải thiết kế mục tiêu.

## Phạm vi và nguyên tắc

- Phạm vi gồm `frontend/` (patient web), `admin/` (doctor/admin web), `backend/` (NestJS API) và `chatbot/` (Express/LangGraph AI service).
- Không suy diễn sản phẩm chỉ từ tên file, menu hoặc README. Khi hành vi chưa chứng minh được, dùng nhãn `[UNCERTAIN]`.
- `[NOT IMPLEMENTED]`: có điểm vào hoặc ý tưởng nhưng chưa thấy implementation hoạt động.
- `[DEAD CODE]`: code tồn tại nhưng không thấy được nối vào flow runtime hiện tại.
- `[DOCUMENTATION ONLY]`: chỉ xuất hiện trong tài liệu/cấu hình mô tả, chưa xác minh bằng runtime code.
- `[TEST-ONLY EXPECTATION]`: chỉ được khẳng định bởi test.
- `[CONFLICT]`: có hai nguồn bằng chứng mâu thuẫn.

## Mức độ tin cậy

`CONFIRMED` nghĩa là có route/controller/service/entity hoặc test trực tiếp. `PARTIAL` nghĩa là chỉ xác nhận được một phần flow. `UNCERTAIN` nghĩa là cần kiểm tra runtime hoặc thiếu bằng chứng.

## Mục lục

- [product-overview.md](./product-overview.md) — hệ thống, biên service, runtime topology và actors.
- [functional-spec.md](./functional-spec.md) — inventory chức năng theo service.
- [user-flows.md](./user-flows.md) — các flow người dùng và flow máy-máy.
- [business-rules.md](./business-rules.md) — rule xác nhận được từ code/database.
- [data-model.md](./data-model.md) — entities, quan hệ, constraint và migration.
- [api-spec.md](./api-spec.md) — HTTP API, chatbot API và WebSocket.
- [permissions.md](./permissions.md) — authentication, role, permission và route guards.
- [error-handling.md](./error-handling.md) — envelope, validation, rate limit, UI error state.
- [integrations.md](./integrations.md) — Postgres, Redis, mail, Cloudinary, OAuth, AI và Docker.
- [known-ambiguities.md](./known-ambiguities.md) — mâu thuẫn, khoảng trống bằng chứng, code chết và coverage thiếu.

## Evidence convention

Mỗi nhóm chức năng có mục **Implementation Evidence**. Các path trong đó là bằng chứng chính cần mở lại khi implementation thay đổi. Graph index của codebase được dùng để định vị symbol; các file không phải source code, migration và cấu hình được kiểm tra trực tiếp.

## Snapshot

- Backend global prefix: `/api/v1`.
- Backend mặc định listen port `3000`; Docker expose host port `3010`.
- Frontend patient mặc định gọi backend qua `VITE_BACKEND_URL` và dùng cookie credentials.
- Admin có route động theo `admin/src/config/menu.ts` và `GenericModulePage`.
- **Patient portal thực chất nối API thật gần như toàn bộ** — `PatientPortalContext.tsx`/`patientMockData.ts` vẫn tồn tại trong source nhưng đã xác nhận là `[DEAD CODE]` (không được mount/gọi ở đâu); chi tiết ở `functional-spec.md`/`known-ambiguities.md`.
- `admin/`: chỉ **1 trang** (`EnterpriseReportsDashboardPage`) dùng mock data thật sự; `mockApi.ts` phần lớn là dead code.
- `chatbot/`: chỉ **4 endpoint HTTP thật** đang hoạt động; luồng "diagnosis" implement đầy đủ nhưng không route nào expose nó (`[DEAD CODE]`, xác nhận bởi chính test tích hợp của service).
- Không có application code nào được thay đổi để tạo/cập nhật bộ tài liệu này (chỉ đọc, không sửa; bộ tài liệu đã qua 1 vòng xác minh lại bổ sung so với bản khởi tạo).
