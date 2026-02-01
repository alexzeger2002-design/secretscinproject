import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/admin/login', credentials);
    if (response.data.success && response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      return response.data;
    }
    throw new Error(response.data.error || 'Login failed');
  },

  async register(data: RegisterData) {
    const response = await api.post('/admin/register', data);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/admin/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('authToken');
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    // Проверяем что токен не пустой и имеет минимальную длину
    // Полная валидация токена делается на сервере
    return token.length > 10;
  },
};
