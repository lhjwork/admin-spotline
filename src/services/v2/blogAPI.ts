import { apiClient } from "../base/apiClient";
import type { BlogListItem, BlogDetailResponse, SpringPage } from "../../types/v2";

export interface BlogListParams {
  page?: number; // 1-indexed (UI 기준)
  size?: number;
  status?: string;
  area?: string;
  keyword?: string;
}

export const blogAPI = {
  getList: (params: BlogListParams = {}) => {
    const { page = 1, size = 20, ...rest } = params;
    return apiClient.get<SpringPage<BlogListItem>>("/api/v2/blogs", {
      params: { page: page - 1, size, ...rest }, // 1-indexed → 0-indexed
    });
  },

  getBySlug: (slug: string) =>
    apiClient.get<BlogDetailResponse>(`/api/v2/blogs/${slug}`),

  unpublish: (slug: string) =>
    apiClient.patch(`/api/v2/blogs/${slug}/unpublish`),

  delete: (slug: string) =>
    apiClient.delete(`/api/v2/blogs/${slug}`),
};
