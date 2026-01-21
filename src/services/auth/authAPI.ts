import { apiClient } from '../base/apiClient';
import { ApiResponseType } from '../base/types';
import type { Admin, LoginResponse } from '../../types';

// 🔑 인증 API
export const authAPI = {
  login: async (username: string, password: string): ApiResponseType<LoginResponse> => {
    try {
      const response = await apiClient.post("/api/admin/login", { 
        username, 
        password 
      });
      
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('admin_token', response.data.data.token);
        localStorage.setItem('admin_data', JSON.stringify(response.data.data.admin));
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  getProfile: (): ApiResponseType<Admin> => 
    apiClient.get("/api/admin/profile"),
  
  verify: (): ApiResponseType<{ valid: boolean }> => 
    apiClient.get("/api/admin/verify"),
  
  createAdmin: (data: Partial<Admin> & { password: string }): ApiResponseType<Admin> => 
    apiClient.post("/api/admin/create", data),
  
  logout: (): Promise<void> => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    return Promise.resolve();
  }
};