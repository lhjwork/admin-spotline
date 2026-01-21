import { apiClient } from '../base/apiClient';
import { ApiResponseType, BaseFilters } from '../base/types';
import type { Recommendation } from '../../types';

// 🎯 추천 관리 API
export const recommendationAPI = {
  getRecommendations: (params: BaseFilters & {
    fromStore?: string;
    toStore?: string;
  } = {}): ApiResponseType<{ recommendations: Recommendation[]; pagination: any }> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.fromStore && { fromStore: params.fromStore }),
      ...(params.toStore && { toStore: params.toStore }),
      ...(params.category && { category: params.category })
    };
    return apiClient.get("/api/admin/recommendations", { params: queryParams });
  },
  
  createRecommendation: (data: Omit<Recommendation, "_id" | "createdAt" | "updatedAt">): ApiResponseType<Recommendation> => 
    apiClient.post("/api/admin/recommendations", data),
  
  updateRecommendation: (id: string, data: Partial<Recommendation>): ApiResponseType<Recommendation> => 
    apiClient.put(`/api/admin/recommendations/${id}`, data),
  
  deleteRecommendation: (id: string): ApiResponseType<void> => 
    apiClient.delete(`/api/admin/recommendations/${id}`),
  
  getStoreRecommendations: (storeId: string): ApiResponseType<Recommendation[]> => 
    apiClient.get(`/api/admin/stores/${storeId}/recommendations`)
};