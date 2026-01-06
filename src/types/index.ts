// 공통 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface Store {
  _id: string;
  name: string;
  category: string;
  location: {
    address: string;
    coordinates: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
    district?: string;
    area?: string;
  };
  contact?: {
    phone?: string;
    website?: string;
    instagram?: string;
  };
  businessHours?: Record<string, { open: string; close: string }>;
  description?: string;
  tags?: string[];
  images?: string[];
  qrCode: {
    id: string;
    isActive: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  _id: string;
  fromStore: string;
  toStore: string;
  category: string;
  priority: number;
  description?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "super_admin";
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  admin: Admin;
  token: string;
  expiresIn: string;
}

export interface DashboardStats {
  totalStores: number;
  activeStores: number;
  totalRecommendations: number;
  totalQRScans: number;
  todayScans?: number;
  uniqueVisitors?: number;
  conversionRate?: number;
}

export interface Analytics {
  _id: string;
  qrCode: string;
  store: string;
  eventType: "qr_scan" | "page_view" | "recommendation_click" | "map_click" | "store_visit";
  targetStore?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  timestamp: string;
  metadata?: {
    category?: string;
    position?: number;
    duration?: number;
  };
}

export interface QRAnalytics {
  qrCode: string;
  totalScans: number;
  uniqueVisitors: number;
  eventBreakdown: Record<string, number>;
  dailyStats: Array<{
    date: string;
    scans: number;
    visitors: number;
  }>;
}

export interface StoreAnalytics {
  storeId: string;
  totalVisits: number;
  recommendationClicks: number;
  conversionRate: number;
  popularRecommendations: Array<{
    category: string;
    clicks: number;
  }>;
}

export interface RecommendationPerformance {
  recommendationId: string;
  fromStore: {
    name: string;
    category: string;
  };
  toStore: {
    name: string;
    category: string;
  };
  clicks: number;
  impressions: number;
  clickRate: number;
  category: string;
}

export interface TrafficStats {
  date: string;
  totalEvents: number;
  uniqueUsers: number;
  qrScans: number;
  pageViews: number;
  recommendationClicks: number;
}

export interface Pagination {
  current: number;
  total: number;
  limit: number;
  count: number;
}
