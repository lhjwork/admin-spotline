import { apiClient } from "../base/apiClient";
import { ApiResponseType } from "../base/types";
import type { NearbyStoresResponse, SelectedRecommendation, ExistingRecommendation, RecommendationCategory, RecommendationStats } from "../../types";

// 🎯 추천 관리 API
export const recommendationAPI = {
  // 근처 매장 목록 조회 (이중 검색)
  getNearbyStores: (
    storeId: string,
    params?: {
      category?: string;
      limit?: number;
      radius?: number;
    },
  ): ApiResponseType<NearbyStoresResponse> => {
    const queryParams = {
      ...(params?.category && { category: params.category }),
      ...(params?.limit && { limit: params.limit }),
      ...(params?.radius && { radius: params.radius }),
    };
    return apiClient.get(`/api/recommendations/nearby-stores/${storeId}`, { params: queryParams });
  },

  // 선택한 매장들과 추천 관계 생성
  createSelectedRecommendations: (storeId: string, selectedStores: SelectedRecommendation[]): ApiResponseType<ExistingRecommendation[]> => {
    return apiClient.post(`/api/recommendations/selected/${storeId}`, { selectedStores });
  },

  // 매장별 기존 추천 목록 조회
  getStoreRecommendations: (storeId: string, params?: { category?: string; limit?: number }): ApiResponseType<ExistingRecommendation[]> => {
    const queryParams = {
      ...(params?.category && { category: params.category }),
      ...(params?.limit && { limit: params.limit }),
    };
    return apiClient.get(`/api/recommendations/store/${storeId}`, { params: queryParams });
  },

  // 개별 추천 관계 수정
  updateRecommendation: (recommendationId: string, data: { category?: string; priority?: number; description?: string }): ApiResponseType<ExistingRecommendation> => {
    return apiClient.put(`/api/recommendations/${recommendationId}`, data);
  },

  // 개별 추천 관계 삭제
  deleteRecommendation: (recommendationId: string): ApiResponseType<void> => {
    return apiClient.delete(`/api/recommendations/${recommendationId}`);
  },

  // 추천 카테고리 목록 조회
  getCategories: (): ApiResponseType<RecommendationCategory[]> => {
    return apiClient.get("/api/recommendations/categories");
  },

  // 추천 통계 조회
  getStats: (): ApiResponseType<RecommendationStats> => {
    return apiClient.get("/api/recommendations/stats");
  },
};
