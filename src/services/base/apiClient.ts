import axios from "axios";
import { supabase } from "../../lib/supabaseClient";

const API_BASE_URL = import.meta.env['VITE_API_URL'] || "";
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 요청 인터셉터 — Supabase access_token 사용
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터 — 401 시 Supabase 로그아웃
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
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
