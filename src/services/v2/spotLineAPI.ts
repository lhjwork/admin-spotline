import { apiClient } from "../base/apiClient";
import type {
  SpotLineDetailResponse,
  SpotLinePreviewResponse,
  CreateSpotLineRequest,
  UpdateSpotLineRequest,
  SpringPage,
  SpotLineTheme,
} from "../../types/v2";

export interface SpotLineListParams {
  page?: number; // 1-indexed (UI 기준)
  size?: number;
  area?: string;
  theme?: SpotLineTheme;
  keyword?: string;
}

export const spotLineAPI = {
  getPopular: (params: SpotLineListParams = {}) => {
    const { page = 1, size = 20, ...rest } = params;
    return apiClient.get<SpringPage<SpotLinePreviewResponse>>("/api/v2/spotlines/popular", {
      params: { page: page - 1, size, ...rest },
    });
  },

  getBySlug: (slug: string) =>
    apiClient.get<SpotLineDetailResponse>(`/api/v2/spotlines/${slug}`),

  create: (data: CreateSpotLineRequest) =>
    apiClient.post<SpotLineDetailResponse>("/api/v2/spotlines", data),

  update: (slug: string, data: UpdateSpotLineRequest) =>
    apiClient.put<SpotLineDetailResponse>(`/api/v2/spotlines/${slug}`, data),

  delete: (slug: string) =>
    apiClient.delete(`/api/v2/spotlines/${slug}`),
};
