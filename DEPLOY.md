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
   
   **ВАЖНО:** Убедитесь что Render имеет доступ к вашему приватному репозиторию. Если видите предупреждение "we don't have access to your repo", нажмите "Connect GitHub" и дайте доступ к организации `alexzeger2002-design`.

5. Добавьте Environment Variables:
   ```
   DATABASE_URL=ваша_строка_подключения_supabase?pgbouncer=true&connection_limit=1
   PORT=3000
   NODE_ENV=production
   TELEGRAM_LINK=https://t.me/SecretScin_bot
   JWT_SECRET=ваш_секретный_ключ_минимум_32_символа
   JWT_EXPIRES_IN=800d
   ```
   
   **ВАЖНО для Supabase:**
   - Добавьте `?pgbouncer=true&connection_limit=1` в конец DATABASE_URL
   - Или используйте Transaction Pooler (порт 6543): замените `:5432` на `:6543` в URL
   - Это предотвратит ошибку "MaxClientsInSessionMode"

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

## Проблемы с подключениями к БД (MaxClientsInSessionMode)

Если видите ошибку "MaxClientsInSessionMode: max clients reached":

1. **Быстрое решение (бесплатно):**
   - Добавьте `&connection_limit=1` в DATABASE_URL в Render
   - Или переключитесь на Transaction Pooler (порт 6543 вместо 5432)

2. **Лучшее решение (для production):**
   - Используйте Transaction Pooler: замените `:5432` на `:6543` в DATABASE_URL
   - Transaction Pooler поддерживает больше одновременных подключений

3. **Если проблема сохраняется:**
   - Рассмотрите платный план Supabase ($25/месяц) - больше подключений
   - Или платный план Render ($7/месяц) - сервис не "засыпает"

## Рекомендации по планам

### Для начала (бесплатно):
- ✅ Render Free + Supabase Free + Vercel Free
- ✅ Используйте Transaction Pooler (порт 6543)
- ✅ Добавьте `connection_limit=1` в DATABASE_URL
- ⚠️ Первый запрос после простоя может быть медленным (30-60 сек)

### Для production (рекомендуется):
- 💰 **Render Starter ($7/месяц)**: сервис не "засыпает", быстрее ответы
- 💰 **Supabase Pro ($25/месяц)**: больше подключений, лучше производительность
- ✅ Vercel Free (достаточно для фронтенда)

**Итого для production: ~$32/месяц** - но сайт будет работать стабильно и быстро.

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
