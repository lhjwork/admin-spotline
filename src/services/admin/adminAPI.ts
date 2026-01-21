import { apiClient } from '../base/apiClient';
import { ApiResponseType, PaginationParams } from '../base/types';
import type { Admin } from '../../types';

// 🏢 Admin 관리 API
export const adminAPI = {
  getProfile: (): ApiResponseType<Admin> => 
    apiClient.get("/api/admin/profile"),
  
  getAdminList: (params: PaginationParams & { 
    role?: string; 
    isActive?: boolean; 
  } = {}): ApiResponseType<{ admins: Admin[]; pagination: any }> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.role && { role: params.role }),
      ...(params.isActive !== undefined && { isActive: params.isActive })
    };
    return apiClient.get("/api/admin/list", { params: queryParams });
  },
  
  updatePermissions: (adminId: string, permissions: { role: string; isActive: boolean }): ApiResponseType<Admin> => 
    apiClient.patch(`/api/admin/${adminId}/permissions`, permissions),
  
  createAdmin: (adminData: Partial<Admin> & { password: string }): ApiResponseType<Admin> => 
    apiClient.post("/api/admin/create", adminData)
};