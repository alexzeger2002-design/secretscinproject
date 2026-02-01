import api from './api';

export interface StatsResponse {
  totalVisits: number;
  uniqueVisitors: number;
  totalClicks: number;
  conversionRate: number;
  topCountries: Array<{ country: string; count: number; percentage: number }>;
  countriesByIP: Array<{ country: string; count: number; percentage: number }>;
  visitsByDate: Array<{ date: string; count: number }>;
  clicksByDate: Array<{ date: string; count: number }>;
}

export const statsService = {
  async getStats(filters?: {
    linkId?: number;
    startDate?: string;
    endDate?: string;
    country?: string;
  }) {
    const response = await api.get('/stats', { params: filters });
    return response.data as StatsResponse;
  },

  async getLinkStats(linkId: number, filters?: {
    startDate?: string;
    endDate?: string;
    country?: string;
  }) {
    const response = await api.get(`/stats/link/${linkId}`, { params: filters });
    return response.data as StatsResponse;
  },
};
