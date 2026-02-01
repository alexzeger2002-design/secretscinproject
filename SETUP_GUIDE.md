# Руководство по настройке

## После обновления кода

### 1. Установите новые зависимости

```bash
npm install
```

Это установит:
- `jsonwebtoken` и `@types/jsonwebtoken` - для JWT авторизации
- `bcryptjs` и `@types/bcryptjs` - для хеширования паролей
- `exceljs` - для экспорта в Excel
- `csv-writer` - для экспорта в CSV

### 2. Обновите базу данных

```bash
# Примените новые миграции
npm run prisma:migrate
```

Введите имя миграции (например: `add_links_and_admin`)

### 3. Обновите файл `.env`

Добавьте в ваш `.env` файл:

```env
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
```

**Важно:** `JWT_SECRET` должен быть длинной случайной строкой (минимум 32 символа). 
Можно сгенерировать через:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Создайте первого администратора

После запуска сервера (`npm run dev`), создайте первого администратора:

```bash
curl -X POST http://localhost:3000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_secure_password_here",
    "email": "admin@example.com"
  }'
```

Или используйте Postman/Insomnia для отправки запроса.

### 5. Авторизуйтесь и получите токен

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_secure_password_here"
  }'
```

Сохраните полученный токен для использования в запросах к админ-панели.

### 6. Создайте первую ссылку

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Моя первая ссылка"
  }'
```

Вы получите ответ с кодом ссылки (например: `abc123`).

### 7. Используйте ссылку

Теперь вы можете использовать ссылку в формате:
```
http://yoursite.com/?code=abc123
```

Фронтенд должен отправлять запрос на `/api/visit?code=abc123` с данными визита.

## Проверка работы

### Проверьте статистику

```bash
# Общая статистика
curl http://localhost:3000/api/stats

# Статистика по ссылке (требует авторизации)
curl http://localhost:3000/api/stats/link/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Проверьте экспорт

```bash
# Экспорт в CSV
curl http://localhost:3000/api/export/csv \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o visits.csv

# Экспорт в Excel
curl http://localhost:3000/api/export/excel \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o visits.xlsx
```

## Структура URL для ссылок

Ваш фронтенд должен:
1. Извлекать код ссылки из URL параметра `?code=abc123`
2. Отправлять его в запросе на `/api/visit?code=abc123`
3. После клика на кнопку Telegram отправлять запрос на `/api/click` с `visitId` и `linkCode`

## Пример интеграции

```javascript
// Фронтенд код (пример)
const urlParams = new URLSearchParams(window.location.search);
const linkCode = urlParams.get('code');

// Создание визита
const visitResponse = await fetch(`http://localhost:3000/api/visit?code=${linkCode}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fingerprint: getBrowserFingerprint(),
    ua: navigator.userAgent,
    referrer: document.referrer,
  }),
});

const { visitId, redirectUrl } = await visitResponse.json();

// После клика на кнопку Telegram
await fetch('http://localhost:3000/api/click', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    visitId,
    linkCode,
  }),
});
```

## Troubleshooting

### Ошибка "JWT_SECRET is not configured"
- Убедитесь, что добавили `JWT_SECRET` в `.env`
- Перезапустите сервер

### Ошибка "Link not found"
- Убедитесь, что ссылка создана через админ-панель
- Проверьте, что код ссылки правильный

### Ошибка "Invalid or expired token"
- Получите новый токен через `/api/admin/login`
- Проверьте, что токен передается в заголовке `Authorization: Bearer <token>`
