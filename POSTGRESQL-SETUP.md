# PostgreSQL подключение

Схема работы такая:

```text
Frontend сайт -> Backend API -> PostgreSQL база данных
```

Frontend напрямую к PostgreSQL не подключается. Сайт отправляет запросы в backend, а backend уже работает с базой.

## Что нужно получить от компании

Попросите у технического специалиста данные PostgreSQL:

```text
host: адрес сервера базы
port: обычно 5432
database: название базы
user: пользователь базы
password: пароль
ssl: нужен или нет
```

Из этих данных собирается строка подключения:

```text
postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

Пример:

```text
postgres://land_user:strong_password@db.company.kz:5432/land_projects
```

## Куда вставить данные

В папке `backend` создайте файл `.env` на основе `.env.example`.

Пример `backend/.env`:

```env
PORT=4000
DATABASE_URL=postgres://land_user:strong_password@db.company.kz:5432/land_projects
DATABASE_SSL=true
JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=12h
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=uploads
```

Если база локальная на компьютере, обычно:

```env
DATABASE_SSL=false
```

Если база на хостинге или сервере компании, часто нужно:

```env
DATABASE_SSL=true
```

## Как создать таблицы

После заполнения `backend/.env` можно создать таблицы командой:

```bash
cd backend
npm run db:setup
```

Команда выполнит SQL-файл:

```text
backend/sql/schema.postgres.sql
```

Этот файл создаст таблицы:

- `app_users` - пользователи и роли;
- `land_projects` - проекты;
- `land_project_files` - документы и материалы.

## Как запустить backend

В папке `backend`:

```bash
npm install
npm run db:setup
npm run dev
```

Backend будет доступен:

```text
http://localhost:4000/api
```

Frontend уже смотрит на этот адрес в файле:

```text
api-config.js
```

## Как создать первого администратора

После подключения базы и запуска SQL создайте первого админа:

```bash
cd backend
set ADMIN_EMAIL=admin@company.kz
set ADMIN_PASSWORD=Admin12345
set ADMIN_FULL_NAME=Admin
npm run create-admin
```

Потом можно войти на сайте:

```text
Логин: admin@company.kz
Пароль: Admin12345
```

После входа админ сможет создавать пользователей и выдавать роли через сайт.

## Что заменить при переносе на настоящий сервер

Когда компания даст production сервер:

- в `backend/.env` заменить `DATABASE_URL`;
- поставить правильный `DATABASE_SSL`;
- заменить `JWT_SECRET` на длинный секрет;
- в `CORS_ORIGIN` указать адрес сайта;
- в `api-config.js` указать адрес backend API.
