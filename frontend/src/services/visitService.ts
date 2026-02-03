import api from './api';

export interface VisitData {
  fingerprint: string;
  referrer?: string;
  utm?: Record<string, string>;
  ua: string;
  linkCode?: string;
}

export interface VisitResponse {
  success: boolean;
  redirectUrl: string;
  visitId: number;
}

// Retry функция с экспоненциальной задержкой
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries = 2,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // Не повторяем для ошибок авторизации или валидации
      if (error.response?.status === 401 || error.response?.status === 400) {
        throw error;
      }
      
      // Если это последняя попытка - выбрасываем ошибку
      if (attempt === maxRetries) {
        break;
      }
      
      // Ждем перед следующей попыткой (экспоненциальная задержка)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError;
}

export const visitService = {
  async createVisit(data: VisitData, code?: string): Promise<VisitResponse> {
    // НЕ используем retry для createVisit, чтобы избежать дубликатов
    // Если запрос не прошел - это не критично, сайт должен работать
    try {
      const response = await api.post('/visit', data, {
        params: code ? { code } : undefined,
        timeout: 20000, // 20 секунд для "просыпающегося" Render
      });
      return response.data;
    } catch (error: any) {
      // При ошибке возвращаем дефолтный ответ, чтобы сайт работал
      console.error('Failed to create visit:', error);
      return {
        success: true,
        redirectUrl: 'https://t.me/SecretScin_bot',
        visitId: -1,
      };
    }
  },

  async createClick(visitId: number | null, linkCode?: string) {
    // Отправляем клик даже если visitId = -1, если есть linkCode
    // Не используем retry для кликов - они не критичны
    try {
      const response = await api.post('/click', { 
        visitId: visitId || undefined, 
        linkCode: linkCode || undefined 
      }, {
        timeout: 10000, // 10 секунд для кликов
      });
      return response.data;
    } catch (error) {
      // Игнорируем ошибки кликов - они не должны блокировать пользователя
      console.error('Failed to track click:', error);
      return { success: false };
    }
  },
};
