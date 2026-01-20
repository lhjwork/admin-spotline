import { apiClient } from '../base/apiClient';
import { ApiResponseType, BaseFilters } from '../base/types';
import type { Store } from '../../types';

// 🏪 운영 매장 API (Live 시스템 사용)
export const operationalStoreAPI = {
  getStores: (params: BaseFilters & { 
    area?: string; 
    active?: boolean;
    status?: string;
  } = {}): ApiResponseType<{ stores: Store[]; pagination: any }> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.search && { search: params.search }),
      ...(params.category && { category: params.category }),
      ...(params.area && { area: params.area }),
      ...(params.status && { status: params.status }),
      ...(params.active !== undefined && { active: params.active })
    };
    return apiClient.get("/api/admin/live/stores", { params: queryParams });
  },
  
  getStore: (id: string): ApiResponseType<Store> => 
    apiClient.get(`/api/admin/live/stores/${id}`),
  
  createStore: (data: Omit<Store, "_id" | "createdAt" | "updatedAt">): ApiResponseType<Store> => {
    // QR 코드에 real_ 접두사 자동 추가
    const storeData = {
      ...data,
      qrCode: {
        ...data.qrCode,
        id: data.qrCode?.id || `real_${Date.now().toString().slice(-8)}`,
        isActive: data.qrCode?.isActive !== false
      }
    };
    return apiClient.post("/api/admin/live/stores", storeData);
  },
  
  updateStore: (id: string, data: Partial<Store>): ApiResponseType<Store> => 
    apiClient.put(`/api/admin/live/stores/${id}`, data),
  
  deleteStore: (id: string): ApiResponseType<void> => 
    apiClient.delete(`/api/admin/live/stores/${id}`),
  
  toggleStatus: (id: string, isActive: boolean): ApiResponseType<Store> => 
    apiClient.patch(`/api/admin/live/stores/${id}/toggle`, { isActive })
};