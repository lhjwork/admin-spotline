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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // CORS 문제 임시 해결
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

// 응답 인터셉터 - 401 에러 시 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_data");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// 인증 API
export const authAPI = {
  // 관리자 로그인 (VERSION002 표준 계정)
  login: (username: string, password: string): Promise<AxiosResponse<ApiResponse<LoginResponse>>> => api.post("/api/admin/login", { username, password }),

  // 관리자 프로필 조회
  getProfile: (): Promise<AxiosResponse<ApiResponse<Admin>>> => api.get("/api/admin/profile"),

  // 토큰 검증
  verifyToken: (): Promise<AxiosResponse<ApiResponse<{ valid: boolean }>>> => api.get("/api/admin/verify"),

  // 관리자 계정 생성
  createAdmin: (data: Partial<Admin> & { password: string }): Promise<AxiosResponse<ApiResponse<Admin>>> => api.post("/api/admin/create", data),
};

// SpotLine 체험 API (VERSION002)
export const experienceAPI = {
  // 체험하기 - 프론트엔드용
  getExperience: (): Promise<AxiosResponse<ApiResponse<ExperienceResult>>> => api.get("/api/experience"),

  // SpotLine 매장 조회
  getSpotlineStore: (qrId: string): Promise<AxiosResponse<ApiResponse<SpotlineStore>>> => api.get(`/api/stores/spotline/${qrId}`),
};

// 체험 설정 관리 API (관리자용)
export const experienceConfigAPI = {
  // 모든 체험 설정 조회
  getConfigs: (): Promise<AxiosResponse<ApiResponse<ExperienceConfig[]>>> => api.get("/api/admin/experience-configs"),

  // 기본 체험 설정 조회
  getDefaultConfig: (): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => api.get("/api/admin/experience-configs/default"),

  // 체험 설정 생성
  createConfig: (data: Omit<ExperienceConfig, "_id" | "createdAt" | "updatedAt" | "usageCount">): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> =>
    api.post("/api/admin/experience-configs", data),

  // 체험 설정 수정
  updateConfig: (id: string, data: Partial<ExperienceConfig>): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => api.put(`/api/admin/experience-configs/${id}`, data),

  // 체험 설정 삭제
  deleteConfig: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => api.delete(`/api/admin/experience-configs/${id}`),

  // 체험 설정 미리보기
  previewConfig: (id: string, testCount: number = 10): Promise<AxiosResponse<ApiResponse<{ results: ExperienceResult[] }>>> =>
    api.get(`/api/admin/experience-configs/${id}/preview?testCount=${testCount}`),

  // 기본 설정으로 지정
  setAsDefault: (id: string): Promise<AxiosResponse<ApiResponse<ExperienceConfig>>> => api.patch(`/api/admin/experience-configs/${id}/set-default`),
};

// 대시보드 API (VERSION002 업데이트)
export const dashboardAPI = {
  getStats: (): Promise<AxiosResponse<ApiResponse<DashboardStats>>> => api.get("/api/admin/dashboard/stats"),
};

// 매장 관리 API
export const storeAPI = {
  // 모든 매장 조회
  getStores: (params?: { category?: string; area?: string; limit?: number }): Promise<AxiosResponse<ApiResponse<Store[]>>> => api.get("/api/stores", { params }),

  // 특정 매장 조회
  getStore: (id: string): Promise<AxiosResponse<ApiResponse<Store>>> => api.get(`/api/stores/${id}`),

  // 매장 등록
  createStore: (data: Omit<Store, "_id" | "createdAt" | "updatedAt">): Promise<AxiosResponse<ApiResponse<Store>>> => api.post("/api/stores", data),

  // 매장 정보 수정
  updateStore: (id: string, data: Partial<Store>): Promise<AxiosResponse<ApiResponse<Store>>> => api.put(`/api/stores/${id}`, data),

  // 매장 삭제 (비활성화)
  deleteStore: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => api.delete(`/api/stores/${id}`),

  // QR 코드로 매장 조회
  getStoreByQR: (qrId: string): Promise<AxiosResponse<ApiResponse<Store>>> => api.get(`/api/stores/qr/${qrId}`),

  // 근처 매장 검색
  getNearbyStores: (lat: number, lng: number, radius?: number): Promise<AxiosResponse<ApiResponse<Store[]>>> => api.get(`/api/stores/nearby/${lat}/${lng}`, { params: { radius } }),
};

// 추천 관리 API
export const recommendationAPI = {
  // 추천 관계 생성
  createRecommendation: (data: Omit<Recommendation, "_id" | "createdAt" | "updatedAt">): Promise<AxiosResponse<ApiResponse<Recommendation>>> => api.post("/api/recommendations", data),

  // 추천 관계 수정
  updateRecommendation: (id: string, data: Partial<Recommendation>): Promise<AxiosResponse<ApiResponse<Recommendation>>> => api.put(`/api/recommendations/${id}`, data),

  // 추천 관계 삭제
  deleteRecommendation: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => api.delete(`/api/recommendations/${id}`),

  // QR 코드별 추천 조회
  getRecommendationsByQR: (qrId: string): Promise<AxiosResponse<ApiResponse<Recommendation[]>>> => api.get(`/api/recommendations/qr/${qrId}`),

  // 매장별 추천 조회
  getRecommendationsByStore: (storeId: string): Promise<AxiosResponse<ApiResponse<Recommendation[]>>> => api.get(`/api/recommendations/store/${storeId}`),

  // 카테고리별 추천 통계
  getCategoryStats: (): Promise<AxiosResponse<ApiResponse<Record<string, number>>>> => api.get("/api/recommendations/stats/categories"),

  // 모든 추천 조회 (관리자용)
  getRecommendations: (params?: { category?: string; limit?: number }): Promise<AxiosResponse<ApiResponse<Recommendation[]>>> => api.get("/api/recommendations", { params }),
};

// 분석 API (VERSION002 업데이트)
export const analyticsAPI = {
  // QR 코드별 통계
  getQRAnalytics: (
    qrId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<AxiosResponse<ApiResponse<QRAnalytics>>> => api.get(`/api/analytics/qr/${qrId}`, { params }),

  // 매장별 통계
  getStoreAnalytics: (
    storeId: string,
    params?: {
      period?: "day" | "week" | "month";
    }
  ): Promise<AxiosResponse<ApiResponse<StoreAnalytics>>> => api.get(`/api/analytics/store/${storeId}`, { params }),

  // 추천 성과 분석
  getRecommendationPerformance: (params?: { category?: string; limit?: number }): Promise<AxiosResponse<ApiResponse<RecommendationPerformance[]>>> =>
    api.get("/api/analytics/recommendations/performance", { params }),

  // 일별 트래픽 통계
  getDailyTraffic: (params?: { days?: number }): Promise<AxiosResponse<ApiResponse<TrafficStats[]>>> => api.get("/api/analytics/traffic/daily", { params }),

  // 체험 설정별 통계 (새로 추가)
  getExperienceStats: (configId?: string): Promise<AxiosResponse<ApiResponse<any>>> => api.get("/api/analytics/experience", { params: { configId } }),

  // 이벤트 로깅
  logEvent: (data: { qrCode: string; eventType: string; targetStore?: string; metadata?: Record<string, any> }): Promise<AxiosResponse<ApiResponse<void>>> => api.post("/api/analytics/event", data),
};

// 지오코딩 API
export const geocodingAPI = {
  // 통합 지오코딩
  unified: (address: string): Promise<AxiosResponse<ApiResponse<any>>> => api.get("/api/geocoding/unified", { params: { address } }),

  // 네이버 지오코딩
  naver: (address: string): Promise<AxiosResponse<ApiResponse<any>>> => api.get("/api/geocoding/naver", { params: { address } }),

  // 구글 지오코딩
  google: (address: string): Promise<AxiosResponse<ApiResponse<any>>> => api.get("/api/geocoding/google", { params: { address } }),

  // 좌표 유효성 검증
  validate: (coordinates: { lat: number; lng: number }): Promise<AxiosResponse<ApiResponse<any>>> => api.post("/api/geocoding/validate", coordinates),
};

// 데모 매장 관리 API (새로 추가)
export const demoStoreAPI = {
  // 데모 매장 목록 조회 (관리자용)
  getDemoStores: (): Promise<AxiosResponse<ApiResponse<DemoStore[]>>> => api.get("/api/admin/demo-stores"),

  // 데모 매장 생성
  createDemoStore: (data: Omit<DemoStore, "_id" | "createdAt" | "updatedAt">): Promise<AxiosResponse<ApiResponse<DemoStore>>> => api.post("/api/admin/demo-stores", data),

  // 데모 매장 수정
  updateDemoStore: (id: string, data: Partial<DemoStore>): Promise<AxiosResponse<ApiResponse<DemoStore>>> => api.put(`/api/admin/demo-stores/${id}`, data),

  // 데모 매장 활성화/비활성화
  toggleDemoStore: (id: string, isActive: boolean): Promise<AxiosResponse<ApiResponse<DemoStore>>> => api.patch(`/api/admin/demo-stores/${id}`, { isActive }),

  // 데모 매장 삭제
  deleteDemoStore: (id: string): Promise<AxiosResponse<ApiResponse<void>>> => api.delete(`/api/admin/demo-stores/${id}`),

  // 데모 사용 통계
  getDemoStats: (): Promise<AxiosResponse<ApiResponse<DemoStats>>> => api.get("/api/admin/demo-stats"),
};

// 어드민 관리 API (기존 호환성 유지)
export const adminAPI = {
  getAdmins: (): Promise<AxiosResponse<ApiResponse<Admin[]>>> => api.get("/api/admin/list"),

  createAdmin: (data: Partial<Admin> & { password: string }): Promise<AxiosResponse<ApiResponse<Admin>>> => authAPI.createAdmin(data),

  updatePermissions: (id: string, permissions: string[]): Promise<AxiosResponse<ApiResponse<Admin>>> => api.patch(`/api/admin/${id}/permissions`, { permissions }),
};

// 데이터 내보내기 API
export const exportAPI = {
  exportData: (type: string, format: string, params?: Record<string, any>): Promise<AxiosResponse<Blob>> =>
    api.get("/api/admin/export", {
      params: { type, format, ...params },
      responseType: "blob",
    }),
};

export default api;
