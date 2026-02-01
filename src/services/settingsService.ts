import prisma from '../config/database';

export class SettingsService {
  /**
   * Получает значение настройки по ключу
   */
  async getSetting(key: string): Promise<string | null> {
    const setting = await prisma.settings.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  /**
   * Устанавливает значение настройки
   */
  async setSetting(key: string, value: string, updatedBy?: number): Promise<void> {
    await prisma.settings.upsert({
      where: { key },
      update: {
        value,
        updatedBy: updatedBy || null,
      },
      create: {
        key,
        value,
        updatedBy: updatedBy || null,
      },
    });
  }

  /**
   * Получает ссылку на Telegram бота
   */
  async getTelegramBotUrl(): Promise<string | null> {
    return this.getSetting('telegram_bot_url');
  }

  /**
   * Устанавливает ссылку на Telegram бота
   */
  async setTelegramBotUrl(url: string, updatedBy?: number): Promise<void> {
    // Валидация URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }
    
    await this.setSetting('telegram_bot_url', url, updatedBy);
  }

  /**
   * Инициализирует настройки из переменных окружения (если их еще нет в БД)
   */
  async initializeFromEnv(): Promise<void> {
    const telegramLink = process.env.TELEGRAM_LINK;
    if (telegramLink) {
      const existing = await this.getTelegramBotUrl();
      if (!existing) {
        await this.setTelegramBotUrl(telegramLink);
      }
    }
  }
}

export const settingsService = new SettingsService();
