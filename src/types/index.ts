// 공통 타입 정의
export interface Store {
  id: string;
  _id?: string;
  name: string;
  address: string;
  phone?: string;
  category: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  location?: {
    address: string;
    coordinates?: {
      coordinates: [number, number];
    };
  };
  contact?: {
    phone?: string;
    website?: string;
    instagram?: string;
  };
  tags?: string[];
  businessHours?: Record<string, { open: string; close: string }>;
}

export interface Recommendation {
  id: string;
  _id?: string;
  storeId: string;
  fromStore?: string;
  toStore?: string;
  title: string;
  description?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  _id?: string;
  username: string;
  email?: string;
  role: string;
  permissions:
    | string[]
    | {
        stores?: { read?: boolean; write?: boolean };
        analytics?: { read?: boolean };
      };
  createdAt: string;
  lastLogin?: string;
}

export interface DashboardStats {
  totalStores: number;
  activeStores: number;
  totalRecommendations: number;
  totalQRScans: number;
  overview?: {
    totalStores: number;
    activeStores: number;
    totalRecommendations: number;
    totalQRScans: number;
  };
  storesByCategory?: Array<{ name: string; value: number }>;
  recentActivity?: Array<{ id: string; type: string; message: string; timestamp: string }>;
}

export interface Pagination {
  current: number;
  total: number;
  limit: number;
  count: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  stores?: T;
  recommendations?: T;
}
