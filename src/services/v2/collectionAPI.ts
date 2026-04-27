import { apiClient } from "../base/apiClient";
import type { SpringPage } from "../../types/v2";

// --- Types ---

export interface CollectionPreview {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  theme: string | null;
  area: string | null;
  itemCount: number;
  viewsCount: number;
}

export interface CollectionDetail extends CollectionPreview {
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: CollectionItemDetail[];
}

export interface CollectionItemDetail {
  id: string;
  itemType: "SPOT" | "SPOTLINE";
  itemOrder: number;
  itemNote: string | null;
  spotId?: string;
  spotSlug?: string;
  spotTitle?: string;
  spotCategory?: string;
  spotArea?: string;
  spotCoverImage?: string;
  spotLineId?: string;
  spotLineSlug?: string;
  spotLineTitle?: string;
  spotLineTheme?: string;
  spotLineArea?: string;
  spotLineSpotCount?: number;
  spotLineCoverImage?: string;
}

export interface CreateCollectionRequest {
  title: string;
  description?: string;
  coverImageUrl?: string;
  theme?: string;
  area?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  displayOrder?: number;
  createdBy?: string;
  items?: CollectionItemRequest[];
}

export interface CollectionItemRequest {
  spotId?: string;
  spotLineId?: string;
  itemOrder?: number;
  itemNote?: string;
}

export interface UpdateCollectionRequest {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  theme?: string;
  area?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  displayOrder?: number;
}

export interface CollectionListParams {
  page?: number;  // 1-indexed (UI)
  size?: number;
  keyword?: string;
}

// --- API ---

export const collectionAPI = {
  list: (params: CollectionListParams = {}) => {
    const { page = 1, size = 20, ...rest } = params;
    return apiClient.get<SpringPage<CollectionDetail>>(
      "/api/v2/collections",
      { params: { page: page - 1, size, ...rest } }
    );
  },

  getBySlug: (slug: string) =>
    apiClient.get<CollectionDetail>(`/api/v2/collections/${slug}`),

  create: (data: CreateCollectionRequest) =>
    apiClient.post<CollectionDetail>("/api/v2/collections", data),

  update: (slug: string, data: UpdateCollectionRequest) =>
    apiClient.put<CollectionDetail>(`/api/v2/collections/${slug}`, data),

  delete: (slug: string) =>
    apiClient.delete(`/api/v2/collections/${slug}`),

  // Item management
  addItem: (slug: string, data: CollectionItemRequest) =>
    apiClient.post<CollectionDetail>(`/api/v2/collections/${slug}/items`, data),

  updateItemOrder: (slug: string, items: { id: string; itemOrder: number }[]) =>
    apiClient.put(`/api/v2/collections/${slug}/items/order`, { items }),

  removeItem: (slug: string, itemId: string) =>
    apiClient.delete(`/api/v2/collections/${slug}/items/${itemId}`),
};
