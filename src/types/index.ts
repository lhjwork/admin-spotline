// 공통 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  status?: number;
}

// SpotLine 매장 타입 (VERSION002)
export interface SpotlineStore {
  id: string;
  name: string;
  shortDescription: string;
  representativeImage: string;
  location: {
    address: string;
    mapLink: string;
  };
  externalLinks: {
    instagram?: string;
    blog?: string;
    notion?: string;
    website?: string;
  };
  spotlineStory: string;
}

// 체험 결과 타입
export interface ExperienceResult {
  qrId: string;
  storeName: string;
  storeId: string;
  area: string;
  configUsed: {
    id: string;
    name: string;
    type: string;
  };
  redirectUrl: string;
}

// 체험 설정 타입
export interface ExperienceConfig {
  _id: string;
  name: string;
  description: string;
  type: "fixed" | "random" | "area_based" | "weighted";
  isActive: boolean;
  isDefault: boolean;
  settings: {
    qrId?: string; // fixed 타입용
    areas?: string[]; // area_based 타입용
    weights?: { qrId: string; weight: number }[]; // weighted 타입용
  };
  priority: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
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
  id: string; // VERSION002에서 id로 변경
  username: string;
  email: string;
  role: "admin" | "super_admin";
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  admin: Admin;
  token: string;
  expiresIn: string;
}

// 데모 매장 타입 (새로 추가)
export interface DemoStore {
  _id: string;
  name: string;
  category: string;
  location: {
    address: string;
    area: string;
  };
  qrCode: {
    id: string;
    isActive: boolean;
  };
  shortDescription: string;
  isActive: boolean;
  isDemoOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

// 데모 통계 타입
export interface DemoStats {
  totalDemoStores: number;
  activeDemoStores: number;
  demoUsageCount: number;
  lastUsed?: string;
}

// 확장된 대시보드 통계
export interface DashboardStats {
  // 실제 운영
  totalStores: number;
  activeStores: number;
  totalRecommendations: number;
  totalQRScans: number;
  todayScans?: number;
  uniqueVisitors?: number;
  conversionRate?: number;
  experienceConfigs?: number;
  activeExperienceConfigs?: number;

  // 데모 시스템 (새로 추가)
  demoStats?: DemoStats;
}

export interface Analytics {
  _id: string;
  qrCode: string;
  store: string;
  eventType: "qr_scan" | "page_view" | "recommendation_click" | "map_click" | "store_visit" | "experience_click";
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
    configId?: string; // 체험 설정 ID
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
  experienceClicks: number; // 새로 추가
}

export interface Pagination {
  current: number;
  total: number;
  limit: number;
  count: number;
}
