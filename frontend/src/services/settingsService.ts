import api from './api';

export interface TelegramBotUrlResponse {
  success: boolean;
  url: string | null;
}

export interface UpdateTelegramBotUrlRequest {
  url: string;
}

export interface UpdateTelegramBotUrlResponse {
  success: boolean;
  message: string;
  url: string;
}

export const settingsService = {
  /**
   * Получает текущую ссылку на Telegram бота (для админки, требует авторизацию)
   */
  async getTelegramBotUrl(): Promise<string | null> {
    const response = await api.get<TelegramBotUrlResponse>('/admin/settings/telegram-bot-url');
    return response.data.url;
  },

  /**
   * Получает текущую ссылку на Telegram бота (публичный роут, для кнопок на сайте)
   */
  async getTelegramBotUrlPublic(): Promise<string> {
    const response = await api.get<TelegramBotUrlResponse>('/admin/settings/telegram-bot-url/public');
    if (!response.data.url) {
      throw new Error('Telegram bot URL is not configured');
    }
    return response.data.url;
  },

  /**
   * Обновляет ссылку на Telegram бота
   */
  async updateTelegramBotUrl(url: string): Promise<string> {
    const response = await api.put<UpdateTelegramBotUrlResponse>('/admin/settings/telegram-bot-url', { url });
    return response.data.url;
  },
};
