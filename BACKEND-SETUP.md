# Backend setup

В папке `backend/` подготовлен обычный сервер API для корпоративного backend.

## Что подготовлено

- Node.js + Express API.
- PostgreSQL-схема в `backend/sql/schema.postgres.sql`.
- JWT-авторизация.
- Роли:
  - `admin` - управляет пользователями и может удалять проекты;
  - `user` - работает с проектами и файлами без удаления проектов.
- Загрузка документов и материалов через backend.
- Настройки через `.env`.

## Как запустить локально

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

API будет доступен на:

```text
http://localhost:4000/api
```

## Как подготовить базу

1. Создайте PostgreSQL базу.
2. Выполните SQL:

```text
backend/sql/schema.postgres.sql
```

3. В `backend/.env` вставьте строку подключения:

```text
DATABASE_URL=postgres://user:password@host:5432/database
```

## Первый админ

После запуска SQL создайте первого админа командой:

```bash
set ADMIN_EMAIL=admin@company.com
set ADMIN_PASSWORD=strong-password
set ADMIN_FULL_NAME=Admin
npm run create-admin
```

После этого остальные пользователи создаются через API:

```http
POST /api/users
Authorization: Bearer ADMIN_TOKEN
```

## Основные endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users` - только admin
- `POST /api/users` - только admin
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id` - только admin
- `GET /api/projects/:projectId/files`
- `POST /api/projects/:projectId/files`
- `GET /api/files/:id/download`
- `DELETE /api/files/:id`

## Что потом заменить на данные компании

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `UPLOAD_DIR`
- host/домен backend-сервера
- место хранения файлов, если компания использует S3/MinIO/собственное хранилище
