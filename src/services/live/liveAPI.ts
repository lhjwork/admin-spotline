import { apiClient } from '../base/apiClient';
import { ApiResponseType, BaseFilters } from '../base/types';

// 🚀 라이브 시스템 관리 API
export const liveAPI = {
  // 라이브 매장 관리
  getLiveStores: (params: BaseFilters & {
    status?: string;
    search?: string;
  } = {}): ApiResponseType<{
    stores: any[];
    pagination: any;
    summary: {
      total: number;
      active: number;
      pending: number;
      suspended: number;
    };
  }> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.search && { search: params.search }),
      ...(params.status && { status: params.status })
    };
    return apiClient.get("/api/admin/live/stores", { params: queryParams });
  },
  
  getLiveStore: (storeId: string): ApiResponseType<any> => 
    apiClient.get(`/api/admin/live/stores/${storeId}`),
  
  approveStore: (storeId: string, approvalNote: string = ''): ApiResponseType<any> => 
    apiClient.patch(`/api/admin/live/stores/${storeId}/approve`, { approvalNote }),
  
  suspendStore: (storeId: string, suspensionReason: string = ''): ApiResponseType<any> => 
    apiClient.patch(`/api/admin/live/stores/${storeId}/suspend`, { suspensionReason }),
  
  // 라이브 추천 관리
  getLiveRecommendations: (): ApiResponseType<any[]> => 
    apiClient.get("/api/admin/live/recommendations"),
  
  createLiveRecommendation: (data: {
    fromStoreId: string;
    toStoreId: string;
    priority: number;
    isActive: boolean;
  }): ApiResponseType<any> => 
    apiClient.post("/api/admin/live/recommendations", data),
  
  updateLiveRecommendation: (recommendationId: string, data: any): ApiResponseType<any> => 
    apiClient.put(`/api/admin/live/recommendations/${recommendationId}`, data),
  
  deleteLiveRecommendation: (recommendationId: string): ApiResponseType<void> => 
    apiClient.delete(`/api/admin/live/recommendations/${recommendationId}`),
  
  // 라이브 분석
  getLiveAnalytics: (): ApiResponseType<{
    overview: {
      totalStores: number;
      activeStores: number;
      pendingStores: number;
      totalViews: number;
      totalQRScans: number;
    };
    trends: {
      dailyViews: number[];
      dailyScans: number[];
      topCategories: Array<{ category: string; count: number; percentage: number }>;
    };
    performance: {
      averageViewsPerStore: number;
      averageScansPerStore: number;
      conversionRate: number;
    };
  }> => 
    apiClient.get("/api/admin/live/analytics"),
  
  getStoreAnalytics: (storeId: string): ApiResponseType<any> => 
    apiClient.get(`/api/admin/live/stores/${storeId}/analytics`),
  
  // 라이브 설정
  getLiveSettings: (): ApiResponseType<{
    isEnabled: boolean;
    requireApproval: boolean;
    maxStoresPerOwner: number;
    analyticsRetentionDays: number;
  }> => 
    apiClient.get("/api/admin/live/settings"),
  
  updateLiveSettings: (settings: {
    isEnabled?: boolean;
    requireApproval?: boolean;
    maxStoresPerOwner?: number;
    analyticsRetentionDays?: number;
  }): ApiResponseType<any> => 
    apiClient.put("/api/admin/live/settings", settings)
};