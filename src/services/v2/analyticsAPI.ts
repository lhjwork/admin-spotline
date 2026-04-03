import { apiClient } from "../base/apiClient";

export interface PlatformStats {
  totalSpots: number;
  totalRoutes: number;
  totalComments: number;
  totalReports: number;
  totalSpotViews: number;
  totalRouteViews: number;
}

export interface PopularContent {
  id: string;
  slug: string;
  title: string;
  label: string;
  viewsCount: number;
  commentsCount: number;
}

export interface DailyTrend {
  date: string;
  spotCount: number;
  routeCount: number;
}

export const analyticsAPI = {
  getStats: () =>
    apiClient.get<PlatformStats>("/admin/analytics/stats").then((r) => r.data),

  getPopularSpots: () =>
    apiClient
      .get<PopularContent[]>("/admin/analytics/popular-spots")
      .then((r) => r.data),

  getPopularRoutes: () =>
    apiClient
      .get<PopularContent[]>("/admin/analytics/popular-routes")
      .then((r) => r.data),

  getDailyTrend: (days = 30) =>
    apiClient
      .get<DailyTrend[]>(`/admin/analytics/daily-trend?days=${days}`)
      .then((r) => r.data),
};
