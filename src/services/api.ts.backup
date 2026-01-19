import axios, { AxiosResponse } from "axios";
import type {
  Store,
  Recommendation,
  Admin,
  ApiResponse,
  LoginResponse,
  QRAnalytics,
  StoreAnalytics,
  RecommendationPerformance,
  ExperienceResult,
  ExperienceConfig,
  SpotlineStore,
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

// 🎪 데모 시스템 관리 API (신규) - 기존 stores API 활용
export const demoAPI = {
  // 데모 매장 관리 - demo_ 접두사 필터링
  getDemoStores: (): Promise<AxiosResponse<ApiResponse<{ stores: Store[]; total: number; system: string }>>> => 
    storeAPI.getStores({ limit: 1000 }).then(response => {
      const allStores = response.data.data?.stores || [];
      const demoStores = allStores.filter(store => 
        store.qrCode?.id?.startsWith('demo_')
      );
      
      return {
        ...response,
        data: {
          ...response.data,
          data: {
            stores: demoStores,
            total: demoStores.length,
            system: 'demo'
          }
        }
      };
    }),
  
  getDemoStore: (storeId: string): Promise<AxiosResponse<ApiResponse<Store>>> => 
    storeAPI.getStore(storeId),
  
  createDemoStore: (data: {
    name: string;
    shortDescription: string;
    representativeImage: string;
    category: string;
    location: {
      address: string;
      coordinates: [number, number];
    };
  }): Promise<AxiosResponse<ApiResponse<Store>>> => {
    // QR 코드에 demo_ 접두사 자동 추가
    const storeData = {
      ...data,
      location: {
        address: data.location.address,
        coordinates: {
          type: "Point" as const,
          coordinates: data.location.coordinates
        },
        area: "데모"
      },
      description: data.shortDescription,
      qrCode: {
        id: `demo_${Date.now().toString().slice(-8)}`,
        isActive: true
      },
      isActive: true
    };
    return storeAPI.createStore(storeData as any);
  },
  
  updateDemoStore: (storeId: string, data: Partial<Store>): Promise<AxiosResponse<ApiResponse<Store>>> => 
    storeAPI.updateStore(storeId, data),
  
  deleteDemoStore: (storeId: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    storeAPI.deleteStore(storeId),
  
  // 데모 추천 관리 - 임시 목 데이터 (백엔드 API 구현 전까지)
  getDemoRecommendations: (): Promise<AxiosResponse<ApiResponse<{ recommendations: any[] }>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 추천 목록을 성공적으로 가져왔습니다.",
        data: {
          recommendations: [
            {
              id: "demo-rec-1",
              name: "달콤한 디저트 카페",
              shortDescription: "커피 후 달콤한 디저트는 어떠세요?",
              category: "dessert",
              distance: 150,
              walkingTime: 2,
              representativeImage: "https://images.unsplash.com/photo-1551024506-0bccd828d307"
            },
            {
              id: "demo-rec-2",
              name: "조용한 독서 공간",
              shortDescription: "책과 함께하는 여유로운 시간",
              category: "culture",
              distance: 200,
              walkingTime: 3,
              representativeImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570"
            },
            {
              id: "demo-rec-3",
              name: "아트 갤러리",
              shortDescription: "예술 작품을 감상하며 영감을 얻어보세요",
              category: "culture",
              distance: 300,
              walkingTime: 4,
              representativeImage: "https://images.unsplash.com/photo-1541961017774-22349e4a1262"
            },
            {
              id: "demo-rec-4",
              name: "루프탑 카페",
              shortDescription: "도시 전망을 즐기며 커피 한 잔",
              category: "cafe",
              distance: 250,
              walkingTime: 3,
              representativeImage: "https://images.unsplash.com/photo-1554118811-1e0d58224f24"
            }
          ]
        }
      }
    } as any),
  
  createDemoRecommendation: (data: {
    name: string;
    shortDescription: string;
    category: string;
    distance: number;
    walkingTime: number;
    representativeImage: string;
  }): Promise<AxiosResponse<ApiResponse<any>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 추천이 생성되었습니다.",
        data: { id: `demo-rec-${Date.now()}`, ...data }
      }
    } as any),
  
  updateDemoRecommendation: (_recommendationId: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 추천이 수정되었습니다.",
        data: { id: `demo-rec-${Date.now()}`, ...data }
      }
    } as any),
  
  deleteDemoRecommendation: (_recommendationId: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 추천이 삭제되었습니다."
      }
    } as any),
  
  // 데모 설정 관리 - 임시 목 데이터
  getDemoSettings: (): Promise<AxiosResponse<ApiResponse<{
    isEnabled: boolean;
    loadingSimulationMs: number;
    version: string;
    lastUpdated: string;
  }>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 시스템 설정을 성공적으로 가져왔습니다.",
        data: {
          isEnabled: true,
          loadingSimulationMs: 500,
          version: "2.0",
          lastUpdated: new Date().toISOString()
        }
      }
    } as any),
  
  updateDemoSettings: (settings: {
    isEnabled?: boolean;
    loadingSimulationMs?: number;
  }): Promise<AxiosResponse<ApiResponse<any>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "데모 시스템 설정이 업데이트되었습니다.",
        data: settings
      }
    } as any)
};

// 🚀 라이브 시스템 관리 API (신규) - 임시 구현 (백엔드 API 구현 전까지)
export const liveAPI = {
  // 라이브 매장 관리 - 임시 빈 데이터
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
  }>>> => 
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
  
  getLiveStore: (storeId: string): Promise<AxiosResponse<ApiResponse<any>>> => 
    Promise.resolve({
      data: {
        success: false,
        message: `라이브 매장을 찾을 수 없습니다. (ID: ${storeId})`
      }
    } as any),
  
  approveStore: (storeId: string, approvalNote: string = ''): Promise<AxiosResponse<ApiResponse<any>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "매장이 승인되었습니다.",
        data: { storeId, approvalNote }
      }
    } as any),
  
  suspendStore: (storeId: string, suspensionReason: string = ''): Promise<AxiosResponse<ApiResponse<any>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "매장이 일시정지되었습니다.",
        data: { storeId, suspensionReason }
      }
    } as any),
  
  // 라이브 추천 관리 - 임시 빈 데이터
  getLiveRecommendations: (): Promise<AxiosResponse<ApiResponse<any[]>>> => 
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
  }): Promise<AxiosResponse<ApiResponse<any>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 추천이 생성되었습니다.",
        data: { id: `live-rec-${Date.now()}`, ...data }
      }
    } as any),
  
  updateLiveRecommendation: (_recommendationId: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 추천이 수정되었습니다.",
        data: { id: `live-rec-${Date.now()}`, ...data }
      }
    } as any),
  
  deleteLiveRecommendation: (_recommendationId: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 추천이 삭제되었습니다."
      }
    } as any),
  
  // 라이브 분석 - 임시 목 데이터
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
  
  getStoreAnalytics: (storeId: string): Promise<AxiosResponse<ApiResponse<any>>> => 
    Promise.resolve({
      data: {
        success: false,
        message: `라이브 매장 분석 데이터를 찾을 수 없습니다. (ID: ${storeId})`
      }
    } as any),
  
  // 라이브 설정 - 임시 목 데이터
  getLiveSettings: (): Promise<AxiosResponse<ApiResponse<{
    isEnabled: boolean;
    requireApproval: boolean;
    maxStoresPerOwner: number;
    analyticsRetentionDays: number;
  }>>> => 
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
  }): Promise<AxiosResponse<ApiResponse<any>>> => 
    Promise.resolve({
      data: {
        success: true,
        message: "라이브 시스템 설정이 업데이트되었습니다.",
        data: settings
      }
    } as any)
};

// 🖥️ 시스템 관리 API (신규) - 임시 구현 (백엔드 API 구현 전까지)
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
    Promise.resolve({
      data: {
        success: true,
        message: "시스템 상태를 성공적으로 가져왔습니다.",
        data: {
          status: "healthy",
          timestamp: new Date().toISOString(),
          systems: {
            demo: "active",
            live: "preparing",
            admin: "active"
          },
          admin: {
            adminId: localStorage.getItem('admin_data') ? 
              JSON.parse(localStorage.getItem('admin_data') || '{}').id || 'unknown' : 'unknown',
            type: "super_admin"
          }
        }
      }
    } as any),
  
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
    Promise.resolve({
      data: {
        success: true,
        message: "시스템 통계를 성공적으로 가져왔습니다.",
        data: {
          demo: {
            stores: 4, // 현재 데모 매장 수
            recommendations: 4, // 데모 추천 수
            lastUpdated: new Date().toISOString()
          },
          live: {
            stores: 0, // 라이브 매장 수
            activeStores: 0,
            pendingStores: 0,
            totalViews: 0,
            totalQRScans: 0,
            lastUpdated: new Date().toISOString()
          },
          admin: {
            totalAdmins: 1,
            lastLogin: new Date().toISOString(),
            currentAdmin: localStorage.getItem('admin_data') ? 
              JSON.parse(localStorage.getItem('admin_data') || '{}').username || 'spotline-admin' : 'spotline-admin'
          }
        }
      }
    } as any)
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

// 하위 호환성을 위한 별칭 - real_ 접두사 필터링
export const operationalStoreAPI = {
  getStores: (params: { 
    page?: number; 
    limit?: number; 
    category?: string; 
    area?: string; 
    active?: boolean;
    search?: string;
    status?: string;
  } = {}): Promise<AxiosResponse<ApiResponse<{ stores: Store[]; pagination: any }>>> => 
    storeAPI.getStores({ ...params, limit: 1000 }).then(response => {
      const allStores = response.data.data?.stores || [];
      const operationalStores = allStores.filter(store => 
        store.qrCode?.id?.startsWith('real_')
      );
      
      // 페이지네이션 재계산
      const page = params.page || 1;
      const limit = params.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStores = operationalStores.slice(startIndex, endIndex);
      
      return {
        ...response,
        data: {
          ...response.data,
          data: {
            stores: paginatedStores,
            pagination: {
              page,
              limit,
              count: operationalStores.length,
              total: Math.ceil(operationalStores.length / limit)
            }
          }
        }
      };
    }),
  
  getStore: (id: string): Promise<AxiosResponse<ApiResponse<Store>>> => 
    storeAPI.getStore(id),
  
  createStore: (data: Omit<Store, "_id" | "createdAt" | "updatedAt">): Promise<AxiosResponse<ApiResponse<Store>>> => {
    // QR 코드에 real_ 접두사 자동 추가
    const storeData = {
      ...data,
      qrCode: {
        ...data.qrCode,
        id: data.qrCode?.id || `real_${Date.now().toString().slice(-8)}`,
        isActive: data.qrCode?.isActive !== false
      }
    };
    return storeAPI.createStore(storeData);
  },
  
  updateStore: (id: string, data: Partial<Store>): Promise<AxiosResponse<ApiResponse<Store>>> => 
    storeAPI.updateStore(id, data),
  
  deleteStore: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => 
    storeAPI.deleteStore(id),
  
  toggleStatus: (id: string, isActive: boolean): Promise<AxiosResponse<ApiResponse<Store>>> => 
    storeAPI.toggleStatus(id, isActive)
};

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

// 🖼️ S3 이미지 업로드 API
export const s3UploadAPI = {
  uploadImage: async (file: File, type: string = 'store'): Promise<AxiosResponse<ApiResponse<{ url: string; key: string }>>> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    const S3_API_BASE_URL = import.meta.env.VITE_S3_API_URL || 'http://localhost:4001/api';
    
    try {
      const response = await axios.post(`${S3_API_BASE_URL}/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  },
  
  deleteImage: async (imageKey: string): Promise<AxiosResponse<ApiResponse<void>>> => {
    const S3_API_BASE_URL = import.meta.env.VITE_S3_API_URL || 'http://localhost:4001/api';
    
    try {
      const response = await axios.delete(`${S3_API_BASE_URL}/upload/image/${encodeURIComponent(imageKey)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('S3 delete error:', error);
      throw error;
    }
  },
  
  getUploadProgress: (file: File, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'store');
      
      const xhr = new XMLHttpRequest();
      const S3_API_BASE_URL = import.meta.env.VITE_S3_API_URL || 'http://localhost:4001/api';
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.data.url);
            } else {
              reject(new Error(response.message || '업로드에 실패했습니다.'));
            }
          } catch (error) {
            reject(new Error('서버 응답을 처리할 수 없습니다.'));
          }
        } else {
          reject(new Error(`업로드 실패: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });
      
      xhr.open('POST', `${S3_API_BASE_URL}/upload/image`);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('admin_token')}`);
      xhr.send(formData);
    });
  }
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