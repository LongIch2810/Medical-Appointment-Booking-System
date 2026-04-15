# LifeHealth

LifeHealth là một nền tảng chăm sóc sức khỏe và đặt lịch khám trực tuyến, gồm nhiều phần chạy tách biệt:

- `frontend`: cổng người dùng/patient portal
- `admin`: workspace cho bác sĩ và quản trị viên
- `backend`: API server
- `chatbot`: dịch vụ chatbot hỗ trợ tư vấn
- `modules`: các module dùng chung trong hệ thống

## Tổng quan

Repo này được xây theo kiến trúc đa dịch vụ. Frontend và admin là ứng dụng React + TypeScript + Vite, backend là NestJS, còn chatbot là một service Node.js/TypeScript dùng cho luồng hỏi đáp và hỗ trợ y tế.

## Công nghệ chính

- Frontend/Admin: React 19, TypeScript, Vite 6, React Router 7, TanStack Query 5, Zustand, Tailwind CSS 4
- Backend: NestJS, TypeORM, PostgreSQL, Redis, Socket.IO, Swagger
- Chatbot: Node.js, TypeScript, LangChain, LangGraph, Qdrant, OpenAI / Google GenAI / Ollama

## Tính năng nổi bật

- Đặt lịch khám và xem danh sách bác sĩ
- Quản lý lịch hẹn, hồ sơ và tương tác giữa bệnh nhân - bác sĩ
- Admin dashboard cho bác sĩ và quản trị viên
- Chat realtime và chatbot hỗ trợ người dùng
- Tích hợp Redis, PostgreSQL, socket, cache và hàng đợi tác vụ

## Cấu trúc thư mục

```text
MyProject/
├─ admin/
├─ backend/
├─ chatbot/
├─ frontend/
├─ modules/
└─ docker-compose.dev.yml
```

## Yêu cầu môi trường

- Node.js 20+ khuyến nghị
- npm
- PostgreSQL
- Redis

## Cài đặt

Mỗi service có `package.json` riêng, nên cài dependency theo từng thư mục:

```bash
cd frontend
npm install

cd ../admin
npm install

cd ../backend
npm install

cd ../chatbot
npm install
```

## Biến môi trường

### `frontend/.env.example`

```env
VITE_BACKEND_URL=
VITE_PROVINCES_API_URL=
VITE_TOKEN_EXPIRE=
```

### `backend/.env.example`

```env
PORT=

DB_USER=
DB_PASSWORD=
DB_NAME=
DB_HOST=
DB_PORT=

REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRE=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRE=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALL_BACK=

FRONTEND_URL=
CHATBOT_URL=

MAIL_USER=
MAIL_PASS=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

`chatbot/.env.example` hiện chưa có nội dung mẫu, bạn có thể cấu hình theo nhu cầu của service.

## Chạy dự án ở môi trường dev

### 1. Chạy hạ tầng

File `docker-compose.dev.yml` hiện cung cấp các dịch vụ hạ tầng:

- PostgreSQL
- Redis
- RedisInsight
- pgAdmin

Khởi động:

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Chạy frontend

```bash
cd frontend
npm run dev
```

Mặc định chạy tại `http://localhost:5173`

### 3. Chạy admin

```bash
cd admin
npm run dev
```

Mặc định chạy tại `http://localhost:4173`

### 4. Chạy backend

```bash
cd backend
npm run start:dev
```

### 5. Chạy chatbot

```bash
cd chatbot
npm run dev
```

## Script hữu ích

### `frontend`

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

### `admin`

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

### `backend`

- `npm run start`
- `npm run start:dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`
- `npm run migration:run`
- `npm run migration:revert`

### `chatbot`

- `npm run dev`
