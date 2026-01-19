import { apiClient } from '../base/apiClient';
import { ApiResponseType, BaseFilters } from '../base/types';
import type { Store } from '../../types';

// 🏪 매장 관리 API
export const storeAPI = {
  getStores: (params: BaseFilters & { 
    area?: string; 
    active?: boolean; 
  } = {}): ApiResponseType<{ stores: Store[]; pagination: any }> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.category && { category: params.category }),
      ...(params.area && { area: params.area }),
      ...(params.active !== undefined && { active: params.active })
    };
    return apiClient.get("/api/admin/stores", { params: queryParams });
  },
  
  getStore: (id: string): ApiResponseType<Store> => 
    apiClient.get(`/api/admin/stores/${id}`),
  
  createStore: (data: Omit<Store, "_id" | "createdAt" | "updatedAt">): ApiResponseType<Store> => 
    apiClient.post("/api/admin/stores", data),
  
  updateStore: (id: string, data: Partial<Store>): ApiResponseType<Store> => 
    apiClient.put(`/api/admin/stores/${id}`, data),
  
  deleteStore: (id: string): ApiResponseType<void> => 
    apiClient.delete(`/api/admin/stores/${id}`),
  
  toggleStatus: (id: string, active: boolean): ApiResponseType<Store> => 
    apiClient.patch(`/api/admin/stores/${id}/toggle`, { active }),
  
  getStoreStats: (): ApiResponseType<any> => 
    apiClient.get("/api/admin/stores/stats")
};