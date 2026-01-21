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
  // 새로운 메인 배너 이미지 시스템
  mainBannerImages?: string[]; // S3 키 배열 (최대 5개)
  // 호환성을 위한 기존 필드 (deprecated)
  images?: string[];
  qrCode: {
    id: string;
    isActive: boolean;
  };
  isActive: boolean;
  recommendationCount?: number; // 추천 개수
  stats?: {
    monthlyScans?: number;
  };
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

// 추천 관리 시스템 타입들
export interface RecommendationCategory {
  value: string;
  label: string;
  description: string;
}

export interface NearbyStore {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  address: string;
  area: string;
  representativeImage: string;
  distance: number;
  walkingTime: number;
  isAlreadyConnected: boolean;
  suggestedCategories: string[];
  matchType: "distance" | "area";
}

export interface ExistingRecommendation {
  id: string;
  toStore: {
    id: string;
    name: string;
    category: string;
    representativeImage?: string;
    location: {
      address: string;
      area: string;
    };
  };
  category: string;
  priority: number;
  description?: string;
  distance?: number;
  walkingTime?: number;
  isActive: boolean;
  createdAt: string;
}

export interface NearbyStoresResponse {
  currentStore: {
    id: string;
    name: string;
    category: string;
    address: string;
    area: string;
    shortDescription: string;
  };
  nearbyStores: NearbyStore[];
  sameAreaStores: NearbyStore[];
  existingRecommendations: ExistingRecommendation[];
}

export interface SelectedRecommendation {
  toStoreId: string;
  category: string;
  priority: number;
  description?: string;
}

export interface RecommendationStats {
  totalRecommendations: number;
  activeRecommendations: number;
  inactiveRecommendations: number;
  categoryStats: Array<{
    _id: string;
    count: number;
  }>;
  topStores: Array<{
    storeName: string;
    count: number;
  }>;
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
