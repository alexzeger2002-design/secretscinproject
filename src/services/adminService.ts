import prisma from '../config/database';
import prismaDirect from '../config/databaseDirect';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreateAdminData {
  username: string;
  password: string;
  email?: string;
}

export class AdminService {
  /**
   * Создает нового администратора
   */
  async createAdmin(data: CreateAdminData): Promise<{ id: number; username: string }> {
    // Используем прямое подключение для создания админа
    try {
      // Проверяем, существует ли пользователь
      const existing = await prismaDirect.adminUser.findFirst({
        where: {
          OR: [
            { username: data.username },
            ...(data.email ? [{ email: data.email }] : []),
          ],
        },
      });

      if (existing) {
        throw new Error('Admin user with this username or email already exists');
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const admin = await prismaDirect.adminUser.create({
        data: {
          username: data.username,
          password: hashedPassword,
          email: data.email || null,
        },
      });

      return {
        id: admin.id,
        username: admin.username,
      };
    } catch (error: any) {
      // Fallback на обычное подключение
      const existing = await prisma.adminUser.findFirst({
        where: {
          OR: [
            { username: data.username },
            ...(data.email ? [{ email: data.email }] : []),
          ],
        },
      });

      if (existing) {
        throw new Error('Admin user with this username or email already exists');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const admin = await prisma.adminUser.create({
        data: {
          username: data.username,
          password: hashedPassword,
          email: data.email || null,
        },
      });

      return {
        id: admin.id,
        username: admin.username,
      };
    }
  }

  /**
   * Авторизация администратора
   * ХАРДКОД - проверка без БД
   */
  async login(credentials: LoginCredentials): Promise<{ token: string; user: { id: number; username: string } }> {
    // Хардкодные логин и пароль
    const HARDCODED_USERNAME = 'Eldar232382193';
    const HARDCODED_PASSWORD = 'ASHcboq12huhe12';
    
    const cleanUsername = credentials.username.trim();
    const cleanPassword = credentials.password.trim();
    
    // Простая проверка
    if (cleanUsername !== HARDCODED_USERNAME || cleanPassword !== HARDCODED_PASSWORD) {
      throw new Error('Invalid credentials');
    }
    
    // Генерируем токен
    const token = generateToken({
      userId: 1,
      username: HARDCODED_USERNAME,
    });

    return {
      token,
      user: {
        id: 1,
        username: HARDCODED_USERNAME,
      },
    };
  }

  /**
   * Обновляет пароль администратора
   */
  async updatePassword(username: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    try {
      await prismaDirect.$executeRaw`
        UPDATE "AdminUser" 
        SET password = ${hashedPassword}, "updatedAt" = NOW()
        WHERE username = ${username}
      `;
    } catch (error: any) {
      // Fallback на обычное подключение
      await prisma.$executeRaw`
        UPDATE "AdminUser" 
        SET password = ${hashedPassword}, "updatedAt" = NOW()
        WHERE username = ${username}
      `;
    }
  }

  /**
   * Получает информацию об администраторе
   * ХАРДКОД - возвращает данные без БД
   */
  async getAdminById(id: number) {
    // Хардкодные данные админа
    return {
      id: 1,
      username: 'Eldar232382193',
      email: null,
      isActive: true,
      createdAt: new Date(),
    };
  }
}

export const adminService = new AdminService();
