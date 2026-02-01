# API Документация

## Базовый URL
```
http://localhost:3000/api
```

## Авторизация

Большинство эндпоинтов админ-панели требуют JWT токен. Получите токен через `/api/admin/login` и передавайте его в заголовке:
```
Authorization: Bearer <your_token>
```

---

## 🔐 Админ-панель

### POST /api/admin/login
Авторизация администратора.

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

### POST /api/admin/register
Создание нового администратора (для первого пользователя).

**Request:**
```json
{
  "username": "admin",
  "password": "password123",
  "email": "admin@example.com"
}
```

### GET /api/admin/me
Получение информации о текущем пользователе (требует авторизации).

---

## 🔗 Управление ссылками

### POST /api/links
Создание новой ссылки (требует авторизации).

**Request:**
```json
{
  "name": "Моя ссылка",
  "code": "abc123" // опционально, если не указан - сгенерируется автоматически
}
```

**Response:**
```json
{
  "success": true,
  "link": {
    "id": 1,
    "code": "abc123",
    "name": "Моя ссылка",
    "isActive": true,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET /api/links
Получение всех ссылок (требует авторизации).

**Query параметры:**
- `stats=true` - включить статистику по каждой ссылке

**Response:**
```json
{
  "success": true,
  "links": [
    {
      "id": 1,
      "code": "abc123",
      "name": "Моя ссылка",
      "isActive": true,
      "stats": {
        "visits": 100,
        "clicks": 50,
        "conversionRate": 50
      }
    }
  ]
}
```

### GET /api/links/:id
Получение ссылки по ID (требует авторизации).

### PUT /api/links/:id
Обновление ссылки (требует авторизации).

**Request:**
```json
{
  "name": "Новое название",
  "isActive": false
}
```

### DELETE /api/links/:id
Удаление ссылки (требует авторизации).

---

## 📊 Статистика

### GET /api/stats
Получение общей статистики (публичный эндпоинт).

**Query параметры:**
- `linkId` - фильтр по ссылке
- `startDate` - начальная дата (ISO format)
- `endDate` - конечная дата (ISO format)
- `country` - фильтр по стране

**Response:**
```json
{
  "totalVisits": 1000,
  "uniqueVisitors": 500,
  "totalClicks": 300,
  "conversionRate": 30,
  "topCountries": [
    { "country": "US", "count": 400, "percentage": 40 },
    { "country": "RU", "count": 300, "percentage": 30 }
  ],
  "countriesByIP": [
    { "country": "US", "count": 400, "percentage": 40 },
    { "country": "RU", "count": 300, "percentage": 30 }
  ],
  "visitsByDate": [
    { "date": "2024-01-01", "count": 50 },
    { "date": "2024-01-02", "count": 60 }
  ],
  "clicksByDate": [
    { "date": "2024-01-01", "count": 20 },
    { "date": "2024-01-02", "count": 25 }
  ]
}
```

### GET /api/stats/link/:linkId
Получение статистики по конкретной ссылке (требует авторизации).

**Query параметры:** те же, что и для `/api/stats`

---

## 📥 Экспорт данных

### GET /api/export/csv
Экспорт визитов в CSV (требует авторизации).

**Query параметры:**
- `linkId` - фильтр по ссылке
- `startDate` - начальная дата
- `endDate` - конечная дата

### GET /api/export/excel
Экспорт визитов в Excel (требует авторизации).

**Query параметры:** те же, что и для CSV

---

## 👤 Визиты

### POST /api/visit
Создание визита (публичный эндпоинт).

**Request:**
```json
{
  "fingerprint": "unique-browser-fingerprint",
  "referrer": "https://example.com",
  "utm": {
    "utm_source": "google",
    "utm_medium": "cpc"
  },
  "ua": "Mozilla/5.0...",
  "linkCode": "abc123" // опционально, код ссылки из URL
}
```

**Или через query параметр:**
```
POST /api/visit?code=abc123
```

**Response:**
```json
{
  "success": true,
  "redirectUrl": "https://t.me/SecretScin_bot",
  "visitId": 123
}
```

---

## 🖱️ Клики

### POST /api/click
Регистрация клика (переход в Telegram). Вызывается фронтендом после клика на кнопку.

**Request:**
```json
{
  "visitId": 123,
  "linkCode": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "click": {
    "id": 1,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## 🔒 Защита от DDoS

Система автоматически:
- Блокирует IP с более чем 50 подозрительными визитами за 24 часа
- Ограничивает до 100 запросов за 15 минут на IP
- Ограничивает до 10 визитов в минуту с одного IP/fingerprint

---

## 📝 Примеры использования

### Создание ссылки и получение статистики

```bash
# 1. Авторизация
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# 2. Создание ссылки
curl -X POST http://localhost:3000/api/links \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Моя ссылка"}'

# 3. Получение статистики
curl http://localhost:3000/api/stats?linkId=1 \
  -H "Authorization: Bearer <token>"
```

### Использование ссылки

```bash
# Пользователь переходит по ссылке: http://yoursite.com/?code=abc123
# Фронтенд отправляет запрос:
curl -X POST http://localhost:3000/api/visit?code=abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "fingerprint": "fp123",
    "ua": "Mozilla/5.0...",
    "referrer": "https://google.com"
  }'

# После клика на кнопку Telegram:
curl -X POST http://localhost:3000/api/click \
  -H "Content-Type: application/json" \
  -d '{"visitId":123,"linkCode":"abc123"}'
```
