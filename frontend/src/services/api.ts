import axios from 'axios';

// В development используем proxy, в production - переменную окружения
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 секунд таймаут - быстрый fallback для медленных запросов
});

// Добавление токена к запросам
api.interceptors.request.use((config) => {
  const requestUrl = config.url || '';
  // Публичные роуты не требуют токена
  const isPublicRoute = requestUrl.includes('/stats') && !requestUrl.includes('/stats/link/') ||
                         requestUrl.includes('/visit') ||
                         requestUrl.includes('/click') ||
                         requestUrl === '/admin/login';
  
  // Добавляем токен только для защищенных роутов
  if (!isPublicRoute) {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
});

// Обработка ошибок
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorStatus = error.response?.status;
    const is401 = errorStatus === 401;
    const requestUrl = error.config?.url || '';
    const isPublicRoute = requestUrl.includes('/stats') || 
                         requestUrl.includes('/visit') || 
                         requestUrl.includes('/click') ||
                         requestUrl === '/admin/login';
    // УБРАЛИ автоматический редирект - теперь ошибки 401 обрабатываются в компонентах
    // Токен удаляется, но редирект не происходит автоматически
    if (is401 && !isPublicRoute) {
      // Удаляем невалидный токен, но НЕ редиректим автоматически
      localStorage.removeItem('authToken');
      // Компоненты сами решат что делать с ошибкой 401
    }
    return Promise.reject(error);
  }
);

export default api;
