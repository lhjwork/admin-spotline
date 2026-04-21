import { apiClient } from "../base/apiClient";
import type {
  SpotDetailResponse,
  CreateSpotRequest,
  UpdateSpotRequest,
  SpringPage,
  SpotCategory,
  SpotStatus,
  BatchStatus,
} from "../../types/v2";

export interface SpotListParams {
  page?: number; // 1-indexed (UI 기준)
  size?: number;
  area?: string;
  category?: SpotCategory;
  keyword?: string;
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

  // 유저 콘텐츠 검토
  getPendingSpots: (params: { page?: number; size?: number } = {}) => {
    const { page = 1, size = 20 } = params;
    return apiClient.get<SpringPage<SpotDetailResponse>>("/api/v2/spots/pending", {
      params: { page: page - 1, size },
    });
  },

  approveSpot: (slug: string) =>
    apiClient.put<SpotDetailResponse>(`/api/v2/spots/${slug}/approve`),

  rejectSpot: (slug: string, reason: string) =>
    apiClient.put<SpotDetailResponse>(`/api/v2/spots/${slug}/reject`, { reason }),

  getPendingCount: () =>
    apiClient.get<{ count: number }>("/api/v2/spots/pending/count"),
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function bulkCreateBatched(
  requests: CreateSpotRequest[],
  batchSize: number = 10,
  onBatchProgress: (batchIndex: number, status: BatchStatus) => void,
): Promise<{ success: number; failed: number; failedBatches: number[] }> {
  const chunks = chunkArray(requests, batchSize);
  let success = 0;
  let failed = 0;
  const failedBatches: number[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    onBatchProgress(i, { batchIndex: i, items: chunk, status: "processing" });
    try {
      const result = await spotAPI.bulkCreate(chunk);
      const count = Array.isArray(result.data) ? result.data.length : chunk.length;
      success += count;
      onBatchProgress(i, { batchIndex: i, items: chunk, status: "success", successCount: count });
    } catch (error) {
      failed += chunk.length;
      failedBatches.push(i);
      onBatchProgress(i, {
        batchIndex: i,
        items: chunk,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { success, failed, failedBatches };
}
