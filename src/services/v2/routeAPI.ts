import { apiClient } from "../base/apiClient";
import type {
  RouteDetailResponse,
  RoutePreviewResponse,
  CreateRouteRequest,
  UpdateRouteRequest,
  SpringPage,
  RouteTheme,
} from "../../types/v2";

export interface RouteListParams {
  page?: number; // 1-indexed (UI 기준)
  size?: number;
  area?: string;
  theme?: RouteTheme;
}

export const routeAPI = {
  getPopular: (params: RouteListParams = {}) => {
    const { page = 1, size = 20, ...rest } = params;
    return apiClient.get<SpringPage<RoutePreviewResponse>>("/api/v2/routes/popular", {
      params: { page: page - 1, size, ...rest },
    });
  },

  getBySlug: (slug: string) =>
    apiClient.get<RouteDetailResponse>(`/api/v2/routes/${slug}`),

  create: (data: CreateRouteRequest) =>
    apiClient.post<RouteDetailResponse>("/api/v2/routes", data),

  update: (slug: string, data: UpdateRouteRequest) =>
    apiClient.put<RouteDetailResponse>(`/api/v2/routes/${slug}`, data),

  delete: (slug: string) =>
    apiClient.delete(`/api/v2/routes/${slug}`),
};
