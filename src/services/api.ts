import axios, { AxiosResponse } from "axios";
import type { Store, Recommendation, Admin, DashboardStats, ApiResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// 타입 정의
export interface LoginResponse {
  token: string;
  admin: {
    id: string;
    username: string;
    email?: string;
    role?: string;
  };
}

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
  login: (username: string, password: string): Promise<AxiosResponse<LoginResponse>> => axios.post(`${API_BASE_URL}/api/admin/login`, { username, password }),
};

// 대시보드 API
export const dashboardAPI = {
  getStats: (): Promise<AxiosResponse<DashboardStats>> => api.get("/api/admin/dashboard/stats"),
};

// 매장 관리 API
export const storeAPI = {
  getStores: (params?: Record<string, any>): Promise<AxiosResponse<ApiResponse<Store[]>>> => api.get("/api/admin/stores", { params }),
  getStore: (id: string): Promise<AxiosResponse<Store>> => api.get(`/api/admin/stores/${id}`),
  createStore: (data: Partial<Store>): Promise<AxiosResponse<Store>> => api.post("/api/admin/stores", data),
  updateStore: (id: string, data: Partial<Store>): Promise<AxiosResponse<Store>> => api.put(`/api/admin/stores/${id}`, data),
  toggleStatus: (id: string, isActive: boolean): Promise<AxiosResponse<Store>> => api.patch(`/api/admin/stores/${id}/status`, { isActive }),
  deleteStore: (id: string): Promise<AxiosResponse<void>> => api.delete(`/api/admin/stores/${id}`),
};

// 추천 관리 API
export const recommendationAPI = {
  getRecommendations: (params?: Record<string, any>): Promise<AxiosResponse<ApiResponse<Recommendation[]>>> => api.get("/api/admin/recommendations", { params }),
  createRecommendation: (data: Partial<Recommendation>): Promise<AxiosResponse<Recommendation>> => api.post("/api/admin/recommendations", data),
  updateRecommendation: (id: string, data: Partial<Recommendation>): Promise<AxiosResponse<Recommendation>> => api.put(`/api/admin/recommendations/${id}`, data),
  deleteRecommendation: (id: string): Promise<AxiosResponse<void>> => api.delete(`/api/admin/recommendations/${id}`),
};

// 분석 API
export const analyticsAPI = {
  getData: (params?: Record<string, any>): Promise<AxiosResponse<any>> => api.get("/api/admin/analytics", { params }),
  getPopularStores: (params?: Record<string, any>): Promise<AxiosResponse<any>> => api.get("/api/admin/analytics/popular-stores", { params }),
  getQRPerformance: (params?: Record<string, any>): Promise<AxiosResponse<any>> => api.get("/api/admin/analytics/qr-performance", { params }),
  getRecommendationPerformance: (params?: Record<string, any>): Promise<AxiosResponse<any>> => api.get("/api/admin/analytics/recommendation-performance", { params }),
};

// 어드민 관리 API
export const adminAPI = {
  getAdmins: (): Promise<AxiosResponse<Admin[]>> => api.get("/api/admin/admins"),
  createAdmin: (data: Partial<Admin>): Promise<AxiosResponse<Admin>> => api.post("/api/admin/admins", data),
  updatePermissions: (id: string, permissions: string[]): Promise<AxiosResponse<Admin>> => api.patch(`/api/admin/admins/${id}/permissions`, { permissions }),
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
