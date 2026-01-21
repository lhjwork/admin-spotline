import { apiClient } from '../base/apiClient';
import { ApiResponseType } from '../base/types';
import type { QRAnalytics, StoreAnalytics, RecommendationPerformance } from '../../types';

// 📈 분석 API
export const analyticsAPI = {
  getData: (params: Record<string, any> = {}): ApiResponseType<any> => 
    apiClient.get("/api/admin/analytics", { params }),
  
  getPopularStores: (params: Record<string, any> = {}): ApiResponseType<any> => 
    apiClient.get("/api/admin/analytics/popular-stores", { params }),
  
  getQRPerformance: (params: Record<string, any> = {}): ApiResponseType<QRAnalytics> => 
    apiClient.get("/api/admin/analytics/qr-performance", { params }),
  
  getRecommendationPerformance: (params: Record<string, any> = {}): ApiResponseType<RecommendationPerformance[]> => 
    apiClient.get("/api/admin/analytics/recommendation-performance", { params }),
  
  getStoreAnalytics: (storeId: string, params: { period?: "day" | "week" | "month" } = {}): ApiResponseType<StoreAnalytics> => {
    const queryParams = {
      period: params.period || 'month',
      storeId
    };
    return apiClient.get("/api/admin/analytics/stores", { params: queryParams });
  }
};