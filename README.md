# LifeHealth

LifeHealth is an online healthcare and medical appointment booking platform made up of several separate services:

- `frontend`: patient-facing user portal
- `admin`: workspace for doctors and administrators
- `backend`: API server
- `chatbot`: chatbot service for consultation support
- `modules`: shared modules used across the system

## Overview

This repository follows a multi-service architecture. The frontend and admin apps are built with React, TypeScript, and Vite. The backend is built with NestJS, and the chatbot is a Node.js/TypeScript service for medical Q&A and user support flows.

## Main Technologies

- Frontend/Admin: React 19, TypeScript, Vite 6, React Router 7, TanStack Query 5, Zustand, Tailwind CSS 4
- Backend: NestJS, TypeORM, PostgreSQL, Redis, Socket.IO, Swagger
- Chatbot: Node.js, TypeScript, LangChain, LangGraph, Qdrant, OpenAI / Google GenAI / Ollama

## Key Features

- Book medical appointments and browse doctors
- Manage appointments, profiles, and patient-doctor interactions
- Admin dashboard for doctors and administrators
- Real-time chat and chatbot support
- Redis, PostgreSQL, socket, cache, and job queue integrations

## Project Structure

```text
MyProject/
+-- admin/
+-- backend/
+-- chatbot/
+-- frontend/
+-- modules/
`-- docker-compose.dev.yml
```

## Requirements

- Node.js 20+ recommended
- npm
- PostgreSQL
- Redis

## Installation

Each service has its own `package.json`, so install dependencies in each directory:

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

## Environment Variables

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

`chatbot/.env.example` currently does not contain sample values. Configure it according to the chatbot service requirements.

## Running the Project in Development

### 1. Start Infrastructure Services

The `docker-compose.dev.yml` file provides the following infrastructure services:

- PostgreSQL
- Redis
- RedisInsight
- pgAdmin

Start them with:

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

### 3. Start the Admin App

```bash
cd admin
npm run dev
```

The admin app runs at `http://localhost:4173` by default.

### 4. Start the Backend

```bash
cd backend
npm run start:dev
```

### 5. Start the Chatbot

```bash
cd chatbot
npm run dev
```

## Useful Scripts

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
