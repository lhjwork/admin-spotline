import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env['VITE_API_URL'] || "";
const LEGACY_API_URL = import.meta.env['VITE_LEGACY_API_URL'] || API_BASE_URL;

// v2 API 클라이언트 (Spring Boot - port 4000)
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 레거시 API 클라이언트 (Express - port 3000, /api/admin/* 전용)
export const legacyApiClient = axios.create({
  baseURL: LEGACY_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
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

// legacyApiClient에도 동일한 인터셉터 적용
legacyApiClient.interceptors.request.use(
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

legacyApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Legacy API Error:', error);

    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_data");
      window.location.href = "/login";
    }

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

export default apiClient;