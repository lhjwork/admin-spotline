import { apiClient } from "../base/apiClient";
import type {
  SpotDetailResponse,
  CreateSpotRequest,
  UpdateSpotRequest,
  SpringPage,
  SpotCategory,
} from "../../types/v2";

export interface SpotListParams {
  page?: number; // 1-indexed (UI 기준)
  size?: number;
  area?: string;
  category?: SpotCategory;
}

export const spotAPI = {
  getList: (params: SpotListParams = {}) => {
    const { page = 1, size = 20, ...rest } = params;
    return apiClient.get<SpringPage<SpotDetailResponse>>("/api/v2/spots", {
      params: { page: page - 1, size, ...rest }, // 1-indexed → 0-indexed
    });
  },

  getBySlug: (slug: string) =>
    apiClient.get<SpotDetailResponse>(`/api/v2/spots/${slug}`),

  create: (data: CreateSpotRequest) =>
    apiClient.post<SpotDetailResponse>("/api/v2/spots", data),

  update: (slug: string, data: UpdateSpotRequest) =>
    apiClient.put<SpotDetailResponse>(`/api/v2/spots/${slug}`, data),

  delete: (slug: string) =>
    apiClient.delete(`/api/v2/spots/${slug}`),

  bulkCreate: (data: CreateSpotRequest[]) =>
    apiClient.post<SpotDetailResponse[]>("/api/v2/spots/bulk", data),
};
