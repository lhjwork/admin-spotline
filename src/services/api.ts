import axios, { AxiosResponse } from "axios";
import type {
  Store,
  Recommendation,
  Admin,
  DashboardStats,
  ApiResponse,
  LoginResponse,
  QRAnalytics,
  StoreAnalytics,
  RecommendationPerformance,
  TrafficStats,
  ExperienceResult,
  ExperienceConfig,
  SpotlineStore,
  DemoStore,
  DemoStats,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 및 응답 변환
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // 401 에러 시 로그아웃
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_data");
      window.location.href = "/login";
    }
    
    // 에러 메시지 표준화
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        '서버 오류가 발생했습니다.';
    
    return Promise.reject({
      ...error,
      message: errorMessage,
      status: error.response?.status
    });
  }
);

// 🔑 인증 API
export const authAPI = {
  login: async (username: string, password: string): Promise<AxiosResponse<ApiResponse<LoginResponse>>> => {
    try {
      const response = await api.post("/api/admin/login", { 
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
  
  getProfile: (): Promise<AxiosResponse<ApiResponse<Admin>>> => 
    api.get("/api/admin/profile"),
  
  verify: (): Promise<AxiosResponse<ApiResponse<{ valid: boolean }>>> => 
    api.get("/api/admin/verify"),
  
  createAdmin: (data: Partial<Admin> & { password: string }): Promise<AxiosResponse<ApiResponse<Admin>>> => 
    api.post("/api/admin/create", data),
  
  logout: (): Promise<void> => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
    return Promise.resolve();
  }
};

// 🏢 기본 Admin 관리 API
export const adminAPI = {
  getProfile: (): Promise<AxiosResponse<ApiResponse<Admin>>> => 
    api.get("/api/admin/profile"),
  
  getAdminList: (params: { 
    page?: number; 
    limit?: number; 
    role?: string; 
    isActive?: boolean; 
  } = {}): Promise<AxiosResponse<ApiResponse<{ admins: Admin[]; pagination: any }>>> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.role && { role: params.role }),
      ...(params.isActive !== undefined && { isActive: params.isActive })
    };
    return api.get("/api/admin/list", { params: queryParams });
  },
  
  updatePermissions: (adminId: string, permissions: { role: string; isActive: boolean }): Promise<AxiosResponse<ApiResponse<Admin>>> => 
    api.patch(`/api/admin/${adminId}/permissions`, permissions),
  
  createAdmin: (adminData: Partial<Admin> & { password: string }): Promise<AxiosResponse<ApiResponse<Admin>>> => 
    api.post("/api/admin/create", adminData)
};

// 🏪 매장 관리 API (기존)
export const storeAPI = {
  getStores: (params: { 
    page?: number; 
    limit?: number; 
    category?: string; 
    area?: string; 
    active?: boolean; 
  } = {}): Promise<AxiosResponse<ApiResponse<{ stores: Store[]; pagination: any }>>> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.category && { category: params.category }),
      ...(params.area && { area: params.area }),
      ...(params.active !== undefined && { active: params.active })
    };
    return api.get("/api/admin/stores", { params: queryParams });
  },
  
  getStore: (id: string): Promise<AxiosResponse<ApiResponse<Store>>> => 
    api.get(`/api/admin/stores/${id}`),
  
  createStore: (data: Omit<Store, "_id" | "createdAt" | "updatedAt">): Promise<AxiosResponse<ApiResponse<Store>>> => 
    api.post("/api/admin/stores", data),
  
  updateStore: (id: string, data: Partial<Store>): Promise<AxiosResponse<ApiResponse<Store>>> => 
    api.put(`/api/admin/stores/${id}`, data),
  
  deleteStore: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    api.delete(`/api/admin/stores/${id}`),
  
  toggleStatus: (id: string, active: boolean): Promise<AxiosResponse<ApiResponse<Store>>> => 
    api.patch(`/api/admin/stores/${id}/toggle`, { active }),
  
  getStoreStats: (): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get("/api/admin/stores/stats")
};

// 🎯 추천 관리 API (기존)
export const recommendationAPI = {
  getRecommendations: (params: {
    page?: number;
    limit?: number;
    fromStore?: string;
    toStore?: string;
    category?: string;
  } = {}): Promise<AxiosResponse<ApiResponse<{ recommendations: Recommendation[]; pagination: any }>>> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.fromStore && { fromStore: params.fromStore }),
      ...(params.toStore && { toStore: params.toStore }),
      ...(params.category && { category: params.category })
    };
    return api.get("/api/admin/recommendations", { params: queryParams });
  },
  
  createRecommendation: (data: Omit<Recommendation, "_id" | "createdAt" | "updatedAt">): Promise<AxiosResponse<ApiResponse<Recommendation>>> => 
    api.post("/api/admin/recommendations", data),
  
  updateRecommendation: (id: string, data: Partial<Recommendation>): Promise<AxiosResponse<ApiResponse<Recommendation>>> => 
    api.put(`/api/admin/recommendations/${id}`, data),
  
  deleteRecommendation: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    api.delete(`/api/admin/recommendations/${id}`),
  
  getStoreRecommendations: (storeId: string): Promise<AxiosResponse<ApiResponse<Recommendation[]>>> => 
    api.get(`/api/admin/stores/${storeId}/recommendations`)
};

// 🎪 데모 시스템 관리 API (신규)
export const demoAPI = {
  // 데모 매장 관리
  getDemoStores: (): Promise<AxiosResponse<ApiResponse<{ stores: DemoStore[]; total: number; system: string }>>> => 
    api.get("/api/admin/demo/stores"),
  
  getDemoStore: (storeId: string): Promise<AxiosResponse<ApiResponse<DemoStore>>> => 
    api.get(`/api/admin/demo/stores/${storeId}`),
  
  createDemoStore: (data: {
    name: string;
    shortDescription: string;
    representativeImage: string;
    category: string;
    location: {
      address: string;
      coordinates: [number, number];
    };
  }): Promise<AxiosResponse<ApiResponse<DemoStore>>> => 
    api.post("/api/admin/demo/stores", data),
  
  updateDemoStore: (storeId: string, data: Partial<DemoStore>): Promise<AxiosResponse<ApiResponse<DemoStore>>> => 
    api.put(`/api/admin/demo/stores/${storeId}`, data),
  
  deleteDemoStore: (storeId: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    api.delete(`/api/admin/demo/stores/${storeId}`),
  
  // 데모 추천 관리
  getDemoRecommendations: (): Promise<AxiosResponse<ApiResponse<{ recommendations: any[] }>>> => 
    api.get("/api/admin/demo/recommendations"),
  
  createDemoRecommendation: (data: {
    name: string;
    shortDescription: string;
    category: string;
    distance: number;
    walkingTime: number;
    representativeImage: string;
  }): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.post("/api/admin/demo/recommendations", data),
  
  updateDemoRecommendation: (id: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.put(`/api/admin/demo/recommendations/${id}`, data),
  
  deleteDemoRecommendation: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    api.delete(`/api/admin/demo/recommendations/${id}`),
  
  // 데모 설정 관리
  getDemoSettings: (): Promise<AxiosResponse<ApiResponse<{
    isEnabled: boolean;
    loadingSimulationMs: number;
    version: string;
    lastUpdated: string;
  }>>> => 
    api.get("/api/admin/demo/settings"),
  
  updateDemoSettings: (settings: {
    isEnabled?: boolean;
    loadingSimulationMs?: number;
  }): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.put("/api/admin/demo/settings", settings)
};

// 🚀 라이브 시스템 관리 API (신규)
export const liveAPI = {
  // 라이브 매장 관리
  getLiveStores: (params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  } = {}): Promise<AxiosResponse<ApiResponse<{
    stores: any[];
    pagination: any;
    summary: {
      total: number;
      active: number;
      pending: number;
      suspended: number;
    };
  }>>> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.status && { status: params.status }),
      ...(params.category && { category: params.category }),
      ...(params.search && { search: params.search })
    };
    return api.get("/api/admin/live/stores", { params: queryParams });
  },
  
  getLiveStore: (storeId: string): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get(`/api/admin/live/stores/${storeId}`),
  
  approveStore: (storeId: string, approvalNote: string = ''): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.post(`/api/admin/live/stores/${storeId}/approve`, { approvalNote }),
  
  suspendStore: (storeId: string, suspensionReason: string = ''): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.post(`/api/admin/live/stores/${storeId}/suspend`, { suspensionReason }),
  
  // 라이브 추천 관리
  getLiveRecommendations: (): Promise<AxiosResponse<ApiResponse<any[]>>> => 
    api.get("/api/admin/live/recommendations"),
  
  createLiveRecommendation: (data: {
    fromStoreId: string;
    toStoreId: string;
    priority: number;
    isActive: boolean;
  }): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.post("/api/admin/live/recommendations", data),
  
  updateLiveRecommendation: (id: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.put(`/api/admin/live/recommendations/${id}`, data),
  
  deleteLiveRecommendation: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    api.delete(`/api/admin/live/recommendations/${id}`),
  
  // 라이브 분석
  getLiveAnalytics: (): Promise<AxiosResponse<ApiResponse<{
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
  }>>> => 
    api.get("/api/admin/live/analytics"),
  
  getStoreAnalytics: (storeId: string): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get(`/api/admin/live/analytics/stores/${storeId}`),
  
  // 라이브 설정
  getLiveSettings: (): Promise<AxiosResponse<ApiResponse<{
    isEnabled: boolean;
    requireApproval: boolean;
    maxStoresPerOwner: number;
    analyticsRetentionDays: number;
  }>>> => 
    api.get("/api/admin/live/settings"),
  
  updateLiveSettings: (settings: {
    isEnabled?: boolean;
    requireApproval?: boolean;
    maxStoresPerOwner?: number;
    analyticsRetentionDays?: number;
  }): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.put("/api/admin/live/settings", settings)
};

// 🖥️ 시스템 관리 API (신규)
export const systemAPI = {
  getSystemHealth: (): Promise<AxiosResponse<ApiResponse<{
    status: string;
    timestamp: string;
    systems: {
      demo: string;
      live: string;
      admin: string;
    };
    admin: {
      adminId: string;
      type: string;
    };
  }>>> => 
    api.get("/api/admin/system/health"),
  
  getSystemStats: (): Promise<AxiosResponse<ApiResponse<{
    demo: {
      stores: number;
      recommendations: number;
      lastUpdated: string;
    };
    live: {
      stores: number;
      activeStores: number;
      pendingStores: number;
      totalViews: number;
      totalQRScans: number;
      lastUpdated: string;
    };
    admin: {
      totalAdmins: number;
      lastLogin: string;
      currentAdmin: string;
    };
  }>>> => 
    api.get("/api/admin/system/stats")
};

// 📊 대시보드 API (통합 통계)
export const dashboardAPI = {
  getStats: async (): Promise<AxiosResponse<ApiResponse<any>>> => {
    try {
      const [systemStats, systemHealth] = await Promise.all([
        systemAPI.getSystemStats(),
        systemAPI.getSystemHealth()
      ]);
      
      return {
        data: {
          success: true,
          data: {
            ...systemStats.data.data,
            health: systemHealth.data.data
          }
        }
      } as any;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  }
};

// 지오코딩 API (주소 검색)
export const geocodingAPI = {
  searchAddress: async (query: string): Promise<AxiosResponse<any>> => {
    const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
    
    if (!KAKAO_API_KEY || KAKAO_API_KEY === 'YOUR_KAKAO_REST_API_KEY') {
      console.warn('Kakao API key not configured, using mock data');
      return {
        data: {
          documents: [
            {
              address_name: `${query} 검색 결과 (목 데이터)`,
              x: "126.9780",
              y: "37.5665"
            }
          ]
        }
      } as any;
    }
    
    try {
      const response = await axios.get(
        'https://dapi.kakao.com/v2/local/search/address.json',
        {
          params: { query },
          headers: {
            Authorization: `KakaoAK ${KAKAO_API_KEY}`
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }
};

// 📈 분석 API (통합)
export const analyticsAPI = {
  getData: (params: Record<string, any> = {}): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get("/api/admin/analytics", { params }),
  
  getPopularStores: (params: Record<string, any> = {}): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get("/api/admin/analytics/popular-stores", { params }),
  
  getQRPerformance: (params: Record<string, any> = {}): Promise<AxiosResponse<ApiResponse<QRAnalytics>>> => 
    api.get("/api/admin/analytics/qr-performance", { params }),
  
  getRecommendationPerformance: (params: Record<string, any> = {}): Promise<AxiosResponse<ApiResponse<RecommendationPerformance[]>>> => 
    api.get("/api/admin/analytics/recommendation-performance", { params }),
  
  getStoreAnalytics: (storeId: string, params: { period?: "day" | "week" | "month" } = {}): Promise<AxiosResponse<ApiResponse<StoreAnalytics>>> => {
    const queryParams = {
      period: params.period || 'month',
      storeId
    };
    return api.get("/api/admin/analytics/stores", { params: queryParams });
  }
};

// 🚀 SpotLine 시작 설정 API
export const spotlineStartAPI = {
  getConfigs: (): Promise<AxiosResponse<ApiResponse<ExperienceConfig[]>>> => {
    // 임시 목 데이터 - 실제 API 구현 시 교체
    return Promise.resolve({
      data: {
        success: true,
        data: [
          {
            id: "config1",
            name: "기본 시작 설정",
            type: "random",
            targetStores: ["store1", "store2", "store3"],
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ]
      }
    } as any);
  },
  
  createConfig: (data: Omit<ExperienceConfig, "_id" | "createdAt" | "updatedAt" | "usageCount">): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => {
    // 실제 API 엔드포인트로 교체 필요
    return api.post("/api/admin/experience-configs", data);
  },
  
  updateConfig: (id: string, data: Partial<ExperienceConfig>): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => 
    api.put(`/api/admin/experience-configs/${id}`, data),
  
  deleteConfig: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    api.delete(`/api/admin/experience-configs/${id}`),
  
  getAvailableStores: (): Promise<AxiosResponse<ApiResponse<{ stores: Store[]; pagination: any }>>> => 
    storeAPI.getStores({ limit: 1000 })
};

// 하위 호환성을 위한 별칭
export const operationalStoreAPI = storeAPI;

// SpotLine 체험 API (VERSION002 호환성 유지)
export const experienceAPI = {
  getExperience: (): Promise<AxiosResponse<ApiResponse<ExperienceResult>>> => 
    api.get("/api/experience"),
  
  getSpotlineStore: (qrId: string): Promise<AxiosResponse<ApiResponse<SpotlineStore>>> => 
    api.get(`/api/stores/spotline/${qrId}`)
};

// 체험 설정 관리 API (관리자용)
export const experienceConfigAPI = {
  getConfigs: (): Promise<AxiosResponse<ApiResponse<ExperienceConfig[]>>> => 
    api.get("/api/admin/experience-configs"),
  
  getDefaultConfig: (): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => 
    api.get("/api/admin/experience-configs/default"),
  
  createConfig: (data: Omit<ExperienceConfig, "_id" | "createdAt" | "updatedAt" | "usageCount">): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> =>
    api.post("/api/admin/experience-configs", data),
  
  updateConfig: (id: string, data: Partial<ExperienceConfig>): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => 
    api.put(`/api/admin/experience-configs/${id}`, data),
  
  deleteConfig: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    api.delete(`/api/admin/experience-configs/${id}`),
  
  previewConfig: (id: string, testCount: number = 10): Promise<AxiosResponse<ApiResponse<{ results: ExperienceResult[] }>>> =>
    api.get(`/api/admin/experience-configs/${id}/preview?testCount=${testCount}`),
  
  setAsDefault: (id: string): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => 
    api.patch(`/api/admin/experience-configs/${id}/set-default`)
};

// 데이터 내보내기 API
export const exportAPI = {
  exportData: (type: string, format: string, params: Record<string, any> = {}): Promise<AxiosResponse<Blob>> =>
    api.get("/api/admin/export", {
      params: { type, format, ...params },
      responseType: "blob",
    })
};

export default api;