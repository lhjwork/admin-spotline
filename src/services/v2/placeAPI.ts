import { apiClient } from "../base/apiClient";
import type { PlaceInfo } from "../../types/v2";

export const placeAPI = {
  search: (query: string, provider: "kakao" | "naver" = "kakao", size = 15) =>
    apiClient.get<PlaceInfo[]>("/api/v2/places/search", {
      params: { query, provider, size },
    }),

  getDetail: (provider: string, placeId: string) =>
    apiClient.get<PlaceInfo>(`/api/v2/places/${provider}/${placeId}`),
};
