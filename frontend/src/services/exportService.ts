import api from './api';

export const exportService = {
  async exportCSV(filters?: {
    linkId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get('/export/csv', {
      params: filters,
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visits_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  async exportExcel(filters?: {
    linkId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get('/export/excel', {
      params: filters,
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visits_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  },
};
