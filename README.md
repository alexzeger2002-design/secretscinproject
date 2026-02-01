# SecretsCin Backend API

Production-ready бэкенд на Node.js + TypeScript + Express + Prisma (PostgreSQL) для лендинга-прокладки с сбором статистики и перенаправлением в Telegram.

## 🚀 Технологический стек

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **Security:** Helmet, CORS, Express-rate-limit, JWT, IP Blocking
- **Auth:** JWT (jsonwebtoken), bcryptjs
- **Export:** ExcelJS, csv-writer
- **Utils:** geoip-lite, morgan, dotenv

## 📋 Требования

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm или yarn

## 🛠️ Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите правильный `DATABASE_URL`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/secretscin?schema=public
TELEGRAM_LINK=https://t.me/SecretScin_bot
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

**Важно:** 
- Замените `user:password` на ваши данные PostgreSQL
- Замените `JWT_SECRET` на случайную строку (минимум 32 символа)

### 3. Инициализация базы данных

```bash
# Генерация Prisma Client
npm run prisma:generate

# Создание миграций и применение схемы
npm run prisma:migrate
```

### 4. Запуск в режиме разработки

```bash
npm run dev
```

Сервер запустится на `http://localhost:3000` (или на порту, указанном в `.env`).

### 5. Создание первого администратора

После запуска сервера создайте первого администратора:

```bash
curl -X POST http://localhost:3000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_secure_password",
    "email": "admin@example.com"
  }'
```

### 6. Сборка для production

```bash
# Компиляция TypeScript
npm run build

# Запуск production сервера
npm start
```

## ✨ Новые функции

### 🔗 Генерация ссылок
- Создание уникальных ссылок с кодами
- Управление ссылками через админ-панель
- Статистика по каждой ссылке отдельно

### 📊 Расширенная статистика
- Графики визитов и кликов по дням (последние 30 дней)
- Статистика по странам с процентами
- График пользователей по странам (по IP)
- Конверсия (переходы в Telegram)

### 🔐 Админ-панель API
- JWT авторизация
- CRUD операции для ссылок
- Фильтры по датам, странам, ссылкам

### 📥 Экспорт данных
- Экспорт в CSV
- Экспорт в Excel
- Фильтрация перед экспортом

### 🛡️ Улучшенная защита от DDoS
- Автоматическая блокировка подозрительных IP
- Улучшенный rate limiting (по IP + fingerprint)
- Строгие лимиты для создания визитов

## 📡 API Endpoints

Подробная документация по API: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### POST /api/visit

Создает новую запись о визите и возвращает ссылку для редиректа.

**Request Body:**
```json
{
  "fingerprint": "unique-browser-fingerprint",
  "referrer": "https://example.com",
  "utm": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "test"
  },
  "ua": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "redirectUrl": "https://t.me/your_telegram_channel"
}
```

**Логика:**
- Определяет IP адрес клиента (с учетом `x-forwarded-for`)
- Определяет страну по IP (geoip-lite)
- Проверяет на фрод: если за последние 60 секунд было > 10 визитов с таким fingerprint, помечает как `isSuspicious = true`
- Сохраняет запись в БД

### GET /api/stats

Возвращает статистику визитов.

**Response:**
```json
{
  "totalVisits": 1234,
  "uniqueVisitors": 567,
  "topCountries": [
    { "country": "US", "count": 450 },
    { "country": "RU", "count": 320 },
    { "country": "DE", "count": 180 }
  ]
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔒 Безопасность

- **Helmet:** Защита от распространенных уязвимостей
- **CORS:** Настроен для работы с любыми источниками (`origin: '*'`)
- **Rate Limiting:** 
  - 100 запросов за 15 минут на IP (общий лимит)
  - 10 визитов в минуту с одного IP/fingerprint
- **IP Blocking:** Автоматическая блокировка IP с >50 подозрительными визитами за 24 часа
- **JWT Auth:** Безопасная авторизация для админ-панели
- **Input Validation:** Все входные данные валидируются через Zod

## 📁 Структура проекта

```
src/
├── config/          # Конфигурация (Prisma Client)
├── controllers/     # Контроллеры (обработка запросов)
├── middlewares/     # Middleware (error handling, rate limit)
├── routes/          # Маршруты API
├── services/        # Бизнес-логика
├── utils/           # Утилиты (IP detection)
├── app.ts           # Сборка Express приложения
└── server.ts        # Точка входа

prisma/
└── schema.prisma    # Схема базы данных
```

## 🗄️ Модель данных

### Link (Ссылки)

- `id` (Int, autoincrement)
- `code` (String, unique) - уникальный код ссылки
- `name` (String?) - название ссылки
- `isActive` (Boolean, default: true)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Visit (Визиты)

- `id` (Int, autoincrement)
- `linkId` (Int?) - связь со ссылкой
- `ip` (String)
- `country` (String?, определяется по IP)
- `browserFingerprint` (String)
- `userAgent` (String)
- `referrer` (String?)
- `utmTags` (Json?, объект с UTM метками)
- `isSuspicious` (Boolean, default: false)
- `timestamp` (DateTime, default: now)

### Click (Клики в Telegram)

- `id` (Int, autoincrement)
- `visitId` (Int) - связь с визитом
- `linkId` (Int) - связь со ссылкой
- `timestamp` (DateTime, default: now)

### AdminUser (Администраторы)

- `id` (Int, autoincrement)
- `username` (String, unique)
- `password` (String) - хешированный пароль
- `email` (String?, unique)
- `isActive` (Boolean, default: true)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🛠️ Полезные команды

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Production
npm start

# Prisma
npm run prisma:generate    # Генерация Prisma Client
npm run prisma:migrate     # Создание и применение миграций
npm run prisma:studio      # Открыть Prisma Studio (GUI для БД)
```

## 📝 Переменные окружения

| Переменная | Описание | Обязательная |
|------------|----------|--------------|
| `DATABASE_URL` | Строка подключения к PostgreSQL | Да |
| `TELEGRAM_LINK` | Ссылка на Telegram канал/бот | Да |
| `JWT_SECRET` | Секретный ключ для JWT токенов | Да |
| `JWT_EXPIRES_IN` | Время жизни JWT токена | Нет (по умолчанию 7d) |
| `PORT` | Порт сервера | Нет (по умолчанию 3000) |
| `NODE_ENV` | Окружение (development/production) | Нет |

## 🐛 Обработка ошибок

Все ошибки обрабатываются централизованно через middleware `errorHandler`:
- **400:** Ошибки валидации (Zod)
- **404:** Ресурс не найден
- **429:** Превышен лимит запросов (rate limit)
- **500:** Внутренняя ошибка сервера

Все ответы об ошибках возвращаются в формате JSON.

## 📊 Мониторинг

- **Morgan:** Логирование всех HTTP запросов в консоль (режим 'dev')
- **Prisma Logs:** В development режиме логируются все SQL запросы

## 🔍 Детекция фрода

Система автоматически определяет подозрительные визиты:
- Если с одного `browserFingerprint` за последние 60 секунд было более 10 визитов, визит помечается как `isSuspicious = true`

## 📄 Лицензия

ISC
