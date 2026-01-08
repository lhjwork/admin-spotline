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
    // 백엔드 응답 형식에 맞게 변환
    if (response.data && typeof response.data === "object") {
      return response;
    }
    return response;
  },
  (error) => {
    console.error("API Error:", error);

    // 401 에러 시 로그아웃
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_data");
      window.location.href = "/login";
    }

    // 에러 메시지 표준화
    const errorMessage = error.response?.data?.message || error.message || "서버 오류가 발생했습니다.";

    return Promise.reject({
      ...error,
      message: errorMessage,
      status: error.response?.status,
    });
  }
);

// 🔑 인증 API
export const authAPI = {
  login: async (username: string, password: string): Promise<AxiosResponse<ApiResponse<LoginResponse>>> => {
    try {
      const response = await api.post("/api/admin/login", {
        username,
        password,
      });

      if (response.data.success && response.data.data.token) {
        localStorage.setItem("admin_token", response.data.data.token);
        localStorage.setItem("admin_data", JSON.stringify(response.data.data.admin));
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  getProfile: (): Promise<AxiosResponse<ApiResponse<Admin>>> => api.get("/api/admin/profile"),

  verify: (): Promise<AxiosResponse<ApiResponse<{ valid: boolean }>>> => api.get("/api/admin/verify"),

  createAdmin: (data: Partial<Admin> & { password: string }): Promise<AxiosResponse<ApiResponse<Admin>>> => api.post("/api/admin/create", data),

  logout: (): Promise<void> => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_data");
    return Promise.resolve();
  },
};

// 📊 대시보드 API
export const dashboardAPI = {
  getStats: (): Promise<AxiosResponse<ApiResponse<DashboardStats>>> => api.get("/api/admin/dashboard/stats"),
};

// 🏪 매장 관리 API (운영 매장)
export const operationalStoreAPI = {
  getStores: (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      status?: string;
    } = {}
  ): Promise<AxiosResponse<ApiResponse<{ stores: Store[]; pagination: any }>>> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.search && { search: params.search }),
      ...(params.category && { category: params.category }),
      ...(params.status && { status: params.status }),
    };
    return api.get("/api/admin/stores", { params: queryParams });
  },

  getStore: (id: string): Promise<AxiosResponse<ApiResponse<Store>>> => api.get(`/api/admin/stores/${id}`),

  createStore: (data: Omit<Store, "_id" | "createdAt" | "updatedAt">): Promise<AxiosResponse<ApiResponse<Store>>> => {
    // QR 코드 ID 자동 생성 (real_ 접두사)
    const storeData = {
      ...data,
      qrCode: {
        ...data.qrCode,
        id: data.qrCode?.id || `real_${Date.now().toString().slice(-8)}`,
      },
    };
    return api.post("/api/admin/stores", storeData);
  },

  updateStore: (id: string, data: Partial<Store>): Promise<AxiosResponse<ApiResponse<Store>>> => api.put(`/api/admin/stores/${id}`, data),

  toggleStatus: (id: string, isActive: boolean): Promise<AxiosResponse<ApiResponse<Store>>> => api.patch(`/api/admin/stores/${id}/status`, { isActive }),

  deleteStore: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => api.delete(`/api/admin/stores/${id}`),
};

// 🎯 추천 관리 API
export const recommendationAPI = {
  getRecommendations: (
    params: {
      page?: number;
      limit?: number;
      fromStore?: string;
      toStore?: string;
    } = {}
  ): Promise<AxiosResponse<ApiResponse<{ recommendations: Recommendation[]; pagination: any }>>> => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.fromStore && { fromStore: params.fromStore }),
      ...(params.toStore && { toStore: params.toStore }),
    };
    return api.get("/api/admin/recommendations", { params: queryParams });
  },

  createRecommendation: (data: {
    fromStore: string;
    toStore: string;
    category: string;
    priority?: number;
    description: string;
    tags?: string[];
  }): Promise<AxiosResponse<ApiResponse<Recommendation>>> => {
    const recommendationData = {
      fromStore: data.fromStore,
      toStore: data.toStore,
      category: data.category,
      priority: data.priority || 5,
      description: data.description,
      tags: data.tags || [],
    };
    return api.post("/api/admin/recommendations", recommendationData);
  },

  updateRecommendation: (id: string, data: Partial<Recommendation>): Promise<AxiosResponse<ApiResponse<Recommendation>>> => api.put(`/api/admin/recommendations/${id}`, data),

  deleteRecommendation: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => api.delete(`/api/admin/recommendations/${id}`),
};

// 📈 분석 및 통계 API
export const analyticsAPI = {
  getStoreAnalytics: (
    params: {
      period?: "day" | "week" | "month";
      storeId?: string;
    } = {}
  ): Promise<AxiosResponse<ApiResponse<StoreAnalytics>>> => {
    const queryParams = {
      period: params.period || "month",
      ...(params.storeId && { storeId: params.storeId }),
    };
    return api.get("/api/admin/analytics/stores", { params: queryParams });
  },

  getPopularStores: (params: Record<string, any> = {}): Promise<AxiosResponse<ApiResponse<any>>> => api.get("/api/admin/analytics/popular-stores", { params }),

  getQRPerformance: (params: Record<string, any> = {}): Promise<AxiosResponse<ApiResponse<QRAnalytics>>> => api.get("/api/admin/analytics/qr-performance", { params }),

  getRecommendationPerformance: (params: Record<string, any> = {}): Promise<AxiosResponse<ApiResponse<RecommendationPerformance[]>>> =>
    api.get("/api/admin/analytics/recommendation-performance", { params }),
};

// SpotLine 시작 설정 API (VERSION003-FINAL 사양)
export const spotlineStartAPI = {
  getConfigs: (): Promise<AxiosResponse<ApiResponse<ExperienceConfig[]>>> => {
    // 임시 목 데이터 - 실제 API 구현 시 교체
    return Promise.resolve({
      data: {
        success: true,
        data: {
          configs: [
            {
              id: "config1",
              name: "기본 시작 설정",
              type: "random",
              targetStores: ["store1", "store2", "store3"],
              isActive: true,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      },
    } as any);
  },

  createConfig: (data: Omit<ExperienceConfig, "_id" | "createdAt" | "updatedAt" | "usageCount">): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => {
    // 실제 API 엔드포인트로 교체 필요
    return api.post("/api/admin/experience-configs", data);
  },

  updateConfig: (id: string, data: Partial<ExperienceConfig>): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => api.put(`/api/admin/experience-configs/${id}`, data),

  deleteConfig: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => api.delete(`/api/admin/experience-configs/${id}`),

  getAvailableStores: (): Promise<AxiosResponse<ApiResponse<{ stores: Store[]; pagination: any }>>> => operationalStoreAPI.getStores({ limit: 1000 }),
};

// 데모 시스템 API (VERSION003-FINAL 사양 - 읽기 전용)
export const demoSystemAPI = {
  getDemoStores: (): Promise<AxiosResponse<ApiResponse<{ stores: DemoStore[]; demoLinks: any }>>> => {
    // 임시 목 데이터 - 실제 API 구현 시 교체
    return Promise.resolve({
      data: {
        success: true,
        data: {
          stores: [
            {
              id: "demo1",
              name: "카페 데모",
              qrCodeId: "demo_cafe_001",
              area: "강남역",
              isDemoOnly: true,
              shortDescription: "데모용 카페입니다",
            },
            {
              id: "demo2",
              name: "레스토랑 데모",
              qrCodeId: "demo_restaurant_001",
              area: "홍대입구",
              isDemoOnly: true,
              shortDescription: "데모용 레스토랑입니다",
            },
          ],
          demoLinks: {
            experience: "/api/demo/experience",
            stores: "/api/demo/stores",
          },
        },
      },
    } as any);
  },
};

// 어드민 관리 API
export const adminAPI = {
  getAdmins: (): Promise<AxiosResponse<ApiResponse<Admin[]>>> => {
    // 임시 목 데이터 - 실제 API 구현 시 교체
    return Promise.resolve({
      data: {
        success: true,
        data: [
          {
            _id: "695bad104e53e6bb484d0b35",
            username: "spotline-admin",
            email: "admin@spotline.co.kr",
            role: "super_admin",
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ],
      },
    } as any);
  },

  createAdmin: (data: Partial<Admin> & { password: string }): Promise<AxiosResponse<ApiResponse<Admin>>> => api.post("/api/admin/admins", data),

  updatePermissions: (id: string, permissions: string[]): Promise<AxiosResponse<ApiResponse<Admin>>> => api.patch(`/api/admin/admins/${id}/permissions`, { permissions }),
};

// 데이터 내보내기 API
export const exportAPI = {
  exportData: (type: string, format: string, params: Record<string, any> = {}): Promise<AxiosResponse<Blob>> =>
    api.get("/api/admin/export", {
      params: { type, format, ...params },
      responseType: "blob",
    }),
};

// 지오코딩 API (주소 검색)
export const geocodingAPI = {
  searchAddress: async (query: string): Promise<AxiosResponse<any>> => {
    const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

    if (!KAKAO_API_KEY || KAKAO_API_KEY === "YOUR_KAKAO_REST_API_KEY") {
      console.warn("Kakao API key not configured, using mock data");
      return {
        data: {
          documents: [
            {
              address_name: `${query} 검색 결과 (목 데이터)`,
              x: "126.9780",
              y: "37.5665",
            },
          ],
        },
      } as any;
    }

    try {
      const response = await axios.get("https://dapi.kakao.com/v2/local/search/address.json", {
        params: { query },
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  },
};

// 하위 호환성을 위한 별칭
export const storeAPI = operationalStoreAPI;

// SpotLine 체험 API (VERSION002 호환성 유지)
export const experienceAPI = {
  getExperience: (): Promise<AxiosResponse<ApiResponse<ExperienceResult>>> => api.get("/api/experience"),

  getSpotlineStore: (qrId: string): Promise<AxiosResponse<ApiResponse<SpotlineStore>>> => api.get(`/api/stores/spotline/${qrId}`),
};

// 체험 설정 관리 API (관리자용)
export const experienceConfigAPI = {
  getConfigs: (): Promise<AxiosResponse<ApiResponse<ExperienceConfig[]>>> => api.get("/api/admin/experience-configs"),

  getDefaultConfig: (): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => api.get("/api/admin/experience-configs/default"),

  createConfig: (data: Omit<ExperienceConfig, "_id" | "createdAt" | "updatedAt" | "usageCount">): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> =>
    api.post("/api/admin/experience-configs", data),

  updateConfig: (id: string, data: Partial<ExperienceConfig>): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => api.put(`/api/admin/experience-configs/${id}`, data),

  deleteConfig: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => api.delete(`/api/admin/experience-configs/${id}`),

  previewConfig: (id: string, testCount: number = 10): Promise<AxiosResponse<ApiResponse<{ results: ExperienceResult[] }>>> =>
    api.get(`/api/admin/experience-configs/${id}/preview?testCount=${testCount}`),

  setAsDefault: (id: string): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => api.patch(`/api/admin/experience-configs/${id}/set-default`),
};

export default api;
