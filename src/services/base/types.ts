import { AxiosResponse } from "axios";

// 공통 API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// 페이지네이션 타입
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  count: number;
  pages?: number;
}

// 공통 필터 타입
export interface BaseFilters extends PaginationParams {
  search?: string;
  category?: string;
  isActive?: boolean;
}

// API 응답 래퍼 타입
export type ApiResponseType<T> = Promise<AxiosResponse<ApiResponse<T>>>;