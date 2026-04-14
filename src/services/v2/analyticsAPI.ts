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

export interface ContentPerformance {
  id: string;
  slug: string;
  title: string;
  area: string;
  creatorName: string;
  viewsCount: number;
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface CreatorProductivity {
  creatorId: string;
  creatorName: string;
  creatorType: string;
  spotCount: number;
  spotLineCount: number;
  totalViews: number;
  totalLikes: number;
  avgViewsPerContent: number;
}

export interface AreaPerformance {
  area: string;
  spotCount: number;
  spotLineCount: number;
  totalViews: number;
  totalLikes: number;
  avgViewsPerSpot: number;
}

export interface PeriodComparison {
  currentSpots: number;
  currentSpotLines: number;
  currentViews: number;
  currentLikes: number;
  previousSpots: number;
  previousSpotLines: number;
  previousViews: number;
  previousLikes: number;
  spotsChangeRate: number;
  spotLinesChangeRate: number;
  viewsChangeRate: number;
  likesChangeRate: number;
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

  getContentPerformance: (from: string, to: string, type = "spot", sort = "views", limit = 50) =>
    apiClient
      .get<ContentPerformance[]>("/admin/analytics/content-performance", {
        params: { from, to, type, sort, limit },
      })
      .then((r) => r.data),

  getCreatorProductivity: (from: string, to: string) =>
    apiClient
      .get<CreatorProductivity[]>("/admin/analytics/creator-productivity", {
        params: { from, to },
      })
      .then((r) => r.data),

  getAreaPerformance: (from: string, to: string) =>
    apiClient
      .get<AreaPerformance[]>("/admin/analytics/area-performance", {
        params: { from, to },
      })
      .then((r) => r.data),

  getPeriodComparison: (from: string, to: string) =>
    apiClient
      .get<PeriodComparison>("/admin/analytics/period-comparison", {
        params: { from, to },
      })
      .then((r) => r.data),
};
