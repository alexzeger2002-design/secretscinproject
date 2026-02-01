import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminService } from '../services/adminService';
import { AppError } from '../middlewares/errorHandler';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const createAdminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email().optional(),
});

export class AdminController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await adminService.login(validatedData);
      res.json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createAdminSchema.parse(req.body);
      const admin = await adminService.createAdmin(validatedData);
      res.status(201).json({
        success: true,
        admin,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as any;
      const userId = authReq.user?.userId;
      
      if (!userId) {
        const error: AppError = new Error('User not found');
        error.statusCode = 401;
        throw error;
      }

      const admin = await adminService.getAdminById(userId);
      if (!admin) {
        const error: AppError = new Error('Admin not found');
        error.statusCode = 404;
        throw error;
      }

      res.json({
        success: true,
        user: admin,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatePasswordSchema = z.object({
        username: z.string().min(1),
        password: z.string().min(6),
      });
      
      const validatedData = updatePasswordSchema.parse(req.body);
      await adminService.updatePassword(validatedData.username, validatedData.password);
      
      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
