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

export const visitService = {
  async createVisit(data: VisitData, code?: string): Promise<VisitResponse> {
    const response = await api.post('/visit', data, {
      params: code ? { code } : undefined,
    });
    return response.data;
  },

  async createClick(visitId: number | null, linkCode?: string) {
    // Отправляем клик даже если visitId = -1, если есть linkCode
    const response = await api.post('/click', { 
      visitId: visitId || undefined, 
      linkCode: linkCode || undefined 
    });
    return response.data;
  },
};
