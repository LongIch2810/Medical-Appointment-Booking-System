# Product overview — AS-IS

## 1. Mục đích sản phẩm

LifeHealth là hệ thống đặt lịch khám và hỗ trợ chăm sóc sức khỏe gồm cổng patient, console doctor/admin, API nghiệp vụ và một service chatbot/AI. Bằng chứng trực tiếp là cấu trúc bốn package, các module NestJS, route patient/admin và các route chatbot.

**Implementation Evidence**

- `frontend/src/routes/AppRoutes.tsx`
- `admin/src/routes/AppRoutes.tsx`
- `backend/src/app.module.ts`
- `chatbot/src/server.ts`
- `docker-compose.dev.yml`

## 2. Các boundary chính

| Boundary | Vai trò hiện trạng |
|---|---|
| Patient web | Trang public, đăng nhập/đăng ký, tìm bác sĩ, đặt lịch và patient portal. |
| Admin/doctor web | Console có permission route, dashboard, CRUD module, clinical communication và report. |
| Backend API | Auth, users, doctors, schedules, appointments, health data, content, messaging, notifications, audit và settings. |
| Chatbot service | Chat, health roadmap, report và tóm tắt hồ sơ từ ảnh/PDF; được bảo vệ bằng internal service key và actor identity. |

## 3. Actors được xác nhận

- Visitor: dùng public pages, doctor listing, news, FAQ, contact, terms.
- Patient: login/register, profile, relatives, appointments, health records, visit results, messages, complaints, AI coach.
- Doctor: doctor dashboard, schedule/appointment workspace, patient records, messages, examination results và settings.
- Administrator: admin dashboard, users/doctors/content/role-permission/clinical data/report/governance modules.
- Internal chatbot caller: frontend/backend integration gọi chatbot qua internal key; actor identity được gắn vào request.

Role constants được khai báo là `ADMIN`, `PATIENT`, `DOCTOR`. Việc một actor cụ thể nhìn thấy dữ liệu nào còn phụ thuộc thêm permission và owner checks trong service.

## 4. Runtime topology

```text
Browser patient :5173/5183 ─┐
Browser admin   :4173/4183 ├─> Backend :3000 (/api/v1) ─> PostgreSQL
                            │                         ├─> Redis/cache/session/rate limit
                            │                         ├─> BullMQ/mail/uploads
                            │                         └─> Socket.IO
                            └─> Chatbot :5000 ─> OpenAI/Qdrant/Cloudinary/PostgreSQL read-only views
```

Port mapping trên là cấu hình Docker hiện có; host dev ports có thể khác nếu chạy Vite trực tiếp.

`[CONFLICT]` Root `README.md` liệt kê nhà cung cấp model của chatbot là "Gemini/OpenAI/Ollama", nhưng toàn bộ code cấu hình LLM/embedding đã đọc (`chatbot/src/configs/llm.ts`, `embeddings.ts`, `.env.example`) chỉ dùng `ChatOpenAI`/`OpenAIEmbeddings` (`@langchain/openai`) qua `OPENAI_*` env; không tìm thấy cấu hình Gemini hay Ollama nào được kết nối thật. Chuỗi "Gemini" chỉ xuất hiện trong một mô tả tool tĩnh (`chatbot/src/tools/ocr.tool.ts:275`: "...bằng Gemini") dù chính tool đó gọi `getVisionModel()` (OpenAI vision model) — mô tả này là văn bản mô tả cho LLM, không phải bằng chứng runtime dùng Gemini. Kết luận: nhà cung cấp AI được xác nhận bằng code là **OpenAI only**; "Gemini/Ollama" ở README là `[DOCUMENTATION ONLY]`, chưa xác minh được trong runtime.

## 5. Trạng thái triển khai

- Backend dùng TypeORM migration (`migrationsRun:true`, `synchronize:false`), fail-fast nếu thiếu `ACCESS_TOKEN_SECRET`/`REFRESH_TOKEN_SECRET` (`backend/src/config/validateEnv.ts`).
- **Cập nhật (đã xác minh lại — sửa nhận định trước đây):** hầu hết màn hình patient portal (`Profile`, `Relatives`, `HealthRecords`, `VisitResults`, `Complaints`, `Settings`, `Dashboard`, `Appointments`, `Messages`, `Notifications`) gọi API thật qua `src/hooks/usePatientPortalApi.ts` + `src/api/*.ts`, **không** qua context mock. `frontend/src/pages/patient/PatientPortalContext.tsx` (+ `patientMockData.ts`, `usePatientPortal.ts`) vẫn tồn tại trong source nhưng `PatientPortalProvider` không được mount ở bất kỳ đâu và `usePatientPortal()` không có nơi gọi nào ngoài file định nghĩa của chính nó — đây là `[DEAD CODE]` đã xác nhận (grep repo-wide, xem `known-ambiguities.md`), không phải nguồn dữ liệu đang hoạt động của patient portal.
- Admin: chỉ **một** trang (`EnterpriseReportsDashboardPage`, danh mục loại báo cáo doanh nghiệp) dùng `mockApi.getEnterpriseReportGroups()` (mock, delay giả lập 220ms). Toàn bộ các trang/`GenericModulePage` module còn lại (users, patients, doctors, appointments, doctor-schedules, audit-logs, complaints, notifications, ratings, exam-results, relatives, health-profiles, relationships, specialties, tags, topics, articles, cả 2 dashboard, messages, settings, 2 tính năng AI) gọi API thật. `src/services/mockApi.ts` có 5 method nhưng 4/5 (`getProfiles/getDashboard/getModule/getMessages/getRolePermissions`) không có nơi gọi nào ngoài chính file đó — `[DEAD CODE]`; `src/components/app/DataTable.tsx` + `src/mock/modules*.ts` cũng là scaffold generic-module cũ đã bị `GenericModulePage.tsx`/`GenericList.tsx` thay thế, không còn được import.
- `[UNCERTAIN]` Không có bằng chứng trong source đủ để khẳng định production deployment, SLA, backup, monitoring hoặc data retention.

**Implementation Evidence**

- `backend/src/database/database.module.ts`, `backend/src/config/validateEnv.ts`
- `frontend/src/hooks/usePatientPortalApi.ts` (nguồn dữ liệu thật hiện tại của patient portal)
- `frontend/src/pages/patient/PatientPortalContext.tsx`, `usePatientPortal.ts` (dead code — không được mount/gọi)
- `admin/src/pages/GenericModulePage.tsx`, `admin/src/services/mockApi.ts`, `admin/src/hooks/useEnterpriseReports.ts`
- `docker-compose.dev.yml`
