import { apiClient } from "../base/apiClient";

export interface ShareStats {
  totalShares: number;
  channelBreakdown: Record<string, number>;
  dailyTrend: { date: string; count: number }[];
}

export interface TopSharedItem {
  targetId: string;
  targetType: string;
  title: string;
  slug: string;
  shareCount: number;
}

export const shareAPI = {
  getStats: (period?: string, targetType?: string) => {
    const params = new URLSearchParams();
    if (period) params.append("period", period);
    if (targetType) params.append("targetType", targetType);
    return apiClient.get<ShareStats>(`/api/v2/shares/stats?${params}`);
  },

  getTopShared: (period = "30d", targetType = "SPOTLINE", limit = 10) =>
    apiClient.get<TopSharedItem[]>(
      `/api/v2/shares/top?period=${period}&targetType=${targetType}&limit=${limit}`
    ),
};
