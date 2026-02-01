import api from './api';

export interface Link {
  id: number;
  code: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  stats?: {
    visits: number;
    clicks: number;
    conversionRate: number;
  };
}

export const linkService = {
  async getAll(withStats = false) {
    const response = await api.get('/links', {
      params: { stats: withStats },
    });
    return response.data.links;
  },

  async getById(id: number) {
    const response = await api.get(`/links/${id}`);
    return response.data.link;
  },

  async create(data: { name?: string; code?: string }) {
    const response = await api.post('/links', data);
    return response.data.link;
  },

  async update(id: number, data: { name?: string; isActive?: boolean }) {
    const response = await api.put(`/links/${id}`, data);
    return response.data.link;
  },

  async delete(id: number) {
    await api.delete(`/links/${id}`);
  },
};
