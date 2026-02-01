# Инструкция по деплою

## Быстрый старт

### 1. Backend на Render

1. Зайдите на [render.com](https://render.com) и создайте аккаунт
2. Нажмите "New +" → "Web Service"
3. Подключите ваш GitHub репозиторий
4. Настройте:
   - **Name**: `secretscin-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `.` (оставьте пустым)
   - **Auto-Deploy**: `Yes` (автоматический деплой при push в GitHub)

5. Добавьте Environment Variables:
   ```
   DATABASE_URL=ваша_строка_подключения_supabase
   PORT=3000
   NODE_ENV=production
   TELEGRAM_LINK=https://t.me/SecretScin_bot
   JWT_SECRET=ваш_секретный_ключ_минимум_32_символа
   JWT_EXPIRES_IN=800d
   ```

6. Нажмите "Create Web Service"
7. Дождитесь деплоя (5-10 минут)
8. Скопируйте URL вашего сервиса (например: `https://secretscin-backend.onrender.com`)

### 2. Frontend на Vercel

1. Обновите `frontend/vercel.json`:
   - Замените `your-backend-url.onrender.com` на реальный URL вашего Render сервиса

2. Зайдите на [vercel.com](https://vercel.com) и создайте аккаунт
3. Нажмите "Add New..." → "Project"
4. Импортируйте ваш GitHub репозиторий
5. Настройте:
   - **Framework Preset**: `Vite` (определится автоматически)
   - **Root Directory**: `frontend` (важно!)
   - **Build Command**: `npm run build` (определится автоматически)
   - **Output Directory**: `dist` (определится автоматически)

6. Добавьте Environment Variable:
   ```
   VITE_API_URL=https://ваш-backend-url.onrender.com/api
   ```
   (замените на реальный URL из шага 1.8)

7. Нажмите "Deploy"
8. Дождитесь деплоя (2-3 минуты)
9. Скопируйте URL вашего frontend (например: `https://secretscin.vercel.app`)

### 3. Финальная проверка

1. Откройте frontend URL в браузере
2. Проверьте что лендинг загружается
3. Проверьте что кнопки Telegram работают
4. Откройте админ панель: `ваш-frontend-url/admin/login`
5. Войдите с учетными данными админа

## Важные замечания

- **Render бесплатный тариф**: сервис "засыпает" после 15 минут бездействия. Первый запрос может занять 30-60 секунд.
- **Переменные окружения**: никогда не коммитьте `.env` файлы. Все секреты храните в настройках Render/Vercel.
- **CORS**: если возникают ошибки CORS, обновите `src/app.ts` и добавьте ваш Vercel URL в список разрешенных источников.

## Создание админа (если нужно)

Если админ еще не создан, используйте API:

```bash
curl -X POST https://ваш-backend-url.onrender.com/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Eldar232382193",
    "password": "ASHcboq12huhe12",
    "email": "admin@example.com"
  }'
```

Или используйте скрипт локально (подключившись к удаленной БД через DATABASE_URL).
