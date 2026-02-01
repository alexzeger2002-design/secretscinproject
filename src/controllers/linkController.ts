import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { linkService } from '../services/linkService';

const createLinkSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
});

const updateLinkSchema = z.object({
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

export class LinkController {
  async createLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createLinkSchema.parse(req.body);
      const link = await linkService.createLink(validatedData);
      res.status(201).json({
        success: true,
        link,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeStats = req.query.stats === 'true';
      const links = await linkService.getAllLinks(includeStats);
      res.json({
        success: true,
        links,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLinkById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error('Invalid link ID');
      }
      const link = await linkService.getLinkById(id);
      if (!link) {
        throw new Error('Link not found');
      }
      res.json({
        success: true,
        link,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error('Invalid link ID');
      }
      const validatedData = updateLinkSchema.parse(req.body);
      const link = await linkService.updateLink(id, validatedData);
      res.json({
        success: true,
        link,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new Error('Invalid link ID');
      }
      await linkService.deleteLink(id);
      res.json({
        success: true,
        message: 'Link deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const linkController = new LinkController();
