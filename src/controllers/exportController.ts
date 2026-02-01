import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { createObjectCsvWriter } from 'csv-writer';
import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export class ExportController {
  async exportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    let tempFilePath: string | null = null;
    
    try {
      const linkId = req.query.linkId ? parseInt(req.query.linkId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const whereClause: any = {};
      if (linkId) whereClause.linkId = linkId;
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = startDate;
        if (endDate) whereClause.timestamp.lte = endDate;
      }

      // Создаем временный файл в системной временной директории
      tempFilePath = path.join(os.tmpdir(), `visits_export_${Date.now()}_${Math.random().toString(36).substring(7)}.csv`);
      
      // Получаем клики для визитов
      const visitsWithClicks = await prisma.visit.findMany({
        where: whereClause,
        include: {
          link: true,
          clicks: {
            include: {
              link: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      const csvWriter = createObjectCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'visitId', title: 'Visit ID' },
          { id: 'linkId', title: 'Link ID' },
          { id: 'linkCode', title: 'Link Code' },
          { id: 'ip', title: 'IP Address' },
          { id: 'country', title: 'Country' },
          { id: 'fingerprint', title: 'Browser Fingerprint' },
          { id: 'userAgent', title: 'User Agent' },
          { id: 'referrer', title: 'Referrer' },
          { id: 'isSuspicious', title: 'Suspicious' },
          { id: 'visitTimestamp', title: 'Visit Timestamp' },
          { id: 'hasClick', title: 'Has Click' },
          { id: 'clickTimestamp', title: 'Click Timestamp' },
        ],
      });

      const records = visitsWithClicks.map((visit) => {
        const click = visit.clicks && visit.clicks.length > 0 ? visit.clicks[0] : null;
        return {
          visitId: visit.id,
          linkId: visit.linkId || 'N/A',
          linkCode: visit.link?.code || 'N/A',
          ip: visit.ip,
          country: visit.country || 'Unknown',
          fingerprint: visit.browserFingerprint || 'N/A',
          userAgent: visit.userAgent,
          referrer: visit.referrer || 'Direct',
          isSuspicious: visit.isSuspicious ? 'Yes' : 'No',
          visitTimestamp: visit.timestamp.toISOString(),
          hasClick: click ? 'Yes' : 'No',
          clickTimestamp: click ? click.timestamp.toISOString() : '',
        };
      });

      await csvWriter.writeRecords(records);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=visits_export.csv');
      
      // Читаем файл асинхронно
      const csvContent = await fs.readFile(tempFilePath);
      
      // Отправляем файл
      res.send(csvContent);
      
      // Удаляем временный файл асинхронно после отправки ответа
      fs.unlink(tempFilePath).catch(() => {
        // Игнорируем ошибки удаления файла
      });
      tempFilePath = null; // Помечаем, что файл удален
    } catch (error) {
      // Очищаем временный файл в случае ошибки
      if (tempFilePath) {
        fs.unlink(tempFilePath).catch(() => {
          // Игнорируем ошибки удаления файла
        });
      }
      next(error);
    }
  }

  async exportExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const linkId = req.query.linkId ? parseInt(req.query.linkId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const whereClause: any = {};
      if (linkId) whereClause.linkId = linkId;
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = startDate;
        if (endDate) whereClause.timestamp.lte = endDate;
      }

      // Получаем визиты с кликами
      const visits = await prisma.visit.findMany({
        where: whereClause,
        include: {
          link: true,
          clicks: {
            include: {
              link: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Visits and Clicks');

      worksheet.columns = [
        { header: 'Visit ID', key: 'visitId', width: 10 },
        { header: 'Link ID', key: 'linkId', width: 10 },
        { header: 'Link Code', key: 'linkCode', width: 15 },
        { header: 'IP Address', key: 'ip', width: 18 },
        { header: 'Country', key: 'country', width: 12 },
        { header: 'Browser Fingerprint', key: 'fingerprint', width: 25 },
        { header: 'User Agent', key: 'userAgent', width: 60 },
        { header: 'Referrer', key: 'referrer', width: 40 },
        { header: 'Suspicious', key: 'isSuspicious', width: 12 },
        { header: 'Visit Timestamp', key: 'visitTimestamp', width: 22 },
        { header: 'Has Click', key: 'hasClick', width: 12 },
        { header: 'Click Timestamp', key: 'clickTimestamp', width: 22 },
      ];

      visits.forEach((visit) => {
        const click = visit.clicks && visit.clicks.length > 0 ? visit.clicks[0] : null;
        worksheet.addRow({
          visitId: visit.id,
          linkId: visit.linkId || 'N/A',
          linkCode: visit.link?.code || 'N/A',
          ip: visit.ip,
          country: visit.country || 'Unknown',
          fingerprint: visit.browserFingerprint || 'N/A',
          userAgent: visit.userAgent,
          referrer: visit.referrer || 'Direct',
          isSuspicious: visit.isSuspicious ? 'Yes' : 'No',
          visitTimestamp: visit.timestamp.toISOString(),
          hasClick: click ? 'Yes' : 'No',
          clickTimestamp: click ? click.timestamp.toISOString() : '',
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=visits_export.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }
}

export const exportController = new ExportController();
