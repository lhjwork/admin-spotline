import { ApiResponseType, BaseFilters } from '../base/types';

// 🚀 라이브 시스템 관리 API
export const liveAPI = {
  // 라이브 매장 관리 - 임시 빈 데이터
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
  }> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 매장 목록을 성공적으로 가져왔습니다.",
        data: {
          stores: [], // 빈 배열 - 아직 라이브 매장 없음
          pagination: {
            page: params.page || 1,
            limit: params.limit || 20,
            total: 0,
            pages: 1
          },
          summary: {
            total: 0,
            active: 0,
            pending: 0,
            suspended: 0
          }
        }
      }
    } as any),
  
  getLiveStore: (storeId: string): ApiResponseType<any> => 
    Promise.resolve({
      data: {
        success: false,
        message: `라이브 매장을 찾을 수 없습니다. (ID: ${storeId})`
      }
    } as any),
  
  approveStore: (storeId: string, approvalNote: string = ''): ApiResponseType<any> => 
    Promise.resolve({
      data: {
        success: true,
        message: "매장이 승인되었습니다.",
        data: { storeId, approvalNote }
      }
    } as any),
  
  suspendStore: (storeId: string, suspensionReason: string = ''): ApiResponseType<any> => 
    Promise.resolve({
      data: {
        success: true,
        message: "매장이 일시정지되었습니다.",
        data: { storeId, suspensionReason }
      }
    } as any),
  
  // 라이브 추천 관리 - 임시 빈 데이터
  getLiveRecommendations: (): ApiResponseType<any[]> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 추천 목록을 성공적으로 가져왔습니다.",
        data: []
      }
    } as any),
  
  createLiveRecommendation: (data: {
    fromStoreId: string;
    toStoreId: string;
    priority: number;
    isActive: boolean;
  }): ApiResponseType<any> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 추천이 생성되었습니다.",
        data: { id: `live-rec-${Date.now()}`, ...data }
      }
    } as any),
  
  updateLiveRecommendation: (_recommendationId: string, data: any): ApiResponseType<any> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 추천이 수정되었습니다.",
        data: { id: `live-rec-${Date.now()}`, ...data }
      }
    } as any),
  
  deleteLiveRecommendation: (_recommendationId: string): ApiResponseType<void> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 추천이 삭제되었습니다."
      }
    } as any),
  
  // 라이브 분석 - 임시 목 데이터
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
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 분석 데이터를 성공적으로 가져왔습니다.",
        data: {
          overview: {
            totalStores: 0,
            activeStores: 0,
            pendingStores: 0,
            totalViews: 0,
            totalQRScans: 0
          },
          trends: {
            dailyViews: Array(7).fill(0),
            dailyScans: Array(7).fill(0),
            topCategories: []
          },
          performance: {
            averageViewsPerStore: 0,
            averageScansPerStore: 0,
            conversionRate: 0
          }
        }
      }
    } as any),
  
  getStoreAnalytics: (storeId: string): ApiResponseType<any> => 
    Promise.resolve({
      data: {
        success: false,
        message: `라이브 매장 분석 데이터를 찾을 수 없습니다. (ID: ${storeId})`
      }
    } as any),
  
  // 라이브 설정 - 임시 목 데이터
  getLiveSettings: (): ApiResponseType<{
    isEnabled: boolean;
    requireApproval: boolean;
    maxStoresPerOwner: number;
    analyticsRetentionDays: number;
  }> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 시스템 설정을 성공적으로 가져왔습니다.",
        data: {
          isEnabled: false, // 아직 라이브 시스템 비활성화
          requireApproval: true,
          maxStoresPerOwner: 5,
          analyticsRetentionDays: 90
        }
      }
    } as any),
  
  updateLiveSettings: (settings: {
    isEnabled?: boolean;
    requireApproval?: boolean;
    maxStoresPerOwner?: number;
    analyticsRetentionDays?: number;
  }): ApiResponseType<any> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 시스템 설정이 업데이트되었습니다.",
        data: settings
      }
    } as any)
};