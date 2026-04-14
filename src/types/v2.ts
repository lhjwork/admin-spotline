// Spring Boot DTO 매칭 타입 — v2 API용

// ── Enums ──

export type SpotCategory =
  | "CAFE" | "RESTAURANT" | "BAR"
  | "NATURE" | "CULTURE" | "EXHIBITION"
  | "WALK" | "ACTIVITY" | "SHOPPING" | "OTHER";

export type SpotSource = "CREW" | "USER" | "QR";

export type SpotLineTheme =
  | "DATE" | "TRAVEL" | "WALK" | "HANGOUT"
  | "FOOD_TOUR" | "CAFE_TOUR" | "CULTURE";

/** @deprecated Use SpotLineTheme instead */
export type RouteTheme = SpotLineTheme;

// ── Place API ──

export interface PlaceInfo {
  provider: "naver" | "kakao";
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  category: string | null;
  businessHours: string | null;
  rating: number | null;
  reviewCount: number | null;
  photos: string[];
  url: string | null;
}

// ── Media ──

export type MediaType = "IMAGE" | "VIDEO";

export interface MediaItemRequest {
  s3Key: string;
  mediaType: MediaType;
  thumbnailS3Key?: string;
  durationSec?: number;
  displayOrder?: number;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface SpotMediaResponse {
  id: string;
  url: string;
  mediaType: MediaType;
  thumbnailUrl: string | null;
  durationSec: number | null;
  displayOrder: number;
}

// ── Spot ──

export interface SpotDetailResponse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: SpotCategory;
  source: SpotSource;
  crewNote: string | null;
  address: string;
  latitude: number;
  longitude: number;
  area: string;
  sido: string | null;
  sigungu: string | null;
  dong: string | null;
  blogUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  naverPlaceId: string | null;
  kakaoPlaceId: string | null;
  tags: string[];
  media: string[];
  mediaItems?: SpotMediaResponse[];
  likesCount: number;
  savesCount: number;
  viewsCount: number;
  creatorType: string;
  creatorName: string | null;
  createdAt: string;
  placeInfo: PlaceInfo | null;
}

export interface CreateSpotRequest {
  title: string;
  description?: string;
  category: SpotCategory;
  source: SpotSource;
  crewNote?: string;
  address: string;
  latitude: number;
  longitude: number;
  area: string;
  sido?: string;
  sigungu?: string;
  dong?: string;
  blogUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  naverPlaceId?: string;
  kakaoPlaceId?: string;
  tags?: string[];
  media?: string[];
  mediaItems?: MediaItemRequest[];
  creatorName?: string;
}

export interface UpdateSpotRequest {
  title?: string;
  description?: string;
  category?: SpotCategory;
  crewNote?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
  naverPlaceId?: string;
  kakaoPlaceId?: string;
  tags?: string[];
  media?: string[];
  mediaItems?: MediaItemRequest[];
}

// ── SpotLine ──

export interface SpotLineSpotDetail {
  order: number;
  suggestedTime: string | null;
  stayDuration: number | null;
  walkingTimeToNext: number | null;
  distanceToNext: number | null;
  transitionNote: string | null;
  spotId: string;
  spotSlug: string;
  spotTitle: string;
  spotCategory: string;
  spotArea: string;
  spotAddress: string;
  spotLatitude: number;
  spotLongitude: number;
  crewNote: string | null;
  spotMedia: string[];
}

export interface SpotLineDetailResponse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  theme: SpotLineTheme;
  area: string;
  totalDuration: number | null;
  totalDistance: number | null;
  spots: SpotLineSpotDetail[];
  likesCount: number;
  savesCount: number;
  replicationsCount: number;
  completionsCount: number;
  creatorType: string;
  creatorName: string | null;
  parentSpotLineId: string | null;
  variationsCount: number;
  createdAt: string;
}

export interface SpotLinePreviewResponse {
  id: string;
  slug: string;
  title: string;
  theme: SpotLineTheme;
  area: string;
  totalDuration: number | null;
  totalDistance: number | null;
  spotCount: number;
  likesCount: number;
}

export interface SpotLineSpotRequest {
  spotId: string;
  order?: number;
  suggestedTime?: string;
  stayDuration?: number;
  walkingTimeToNext?: number;
  distanceToNext?: number;
  transitionNote?: string;
}

export interface CreateSpotLineRequest {
  title: string;
  description?: string;
  theme: SpotLineTheme;
  area: string;
  spots: SpotLineSpotRequest[];
  parentSpotLineId?: string;
  creatorName?: string;
}

export interface UpdateSpotLineRequest {
  title?: string;
  description?: string;
  theme?: SpotLineTheme;
  area?: string;
  spots?: SpotLineSpotRequest[];
}

// ── Partner ──

export type PartnerTier = "BASIC" | "PREMIUM";
export type PartnerStatus = "ACTIVE" | "PAUSED" | "TERMINATED";

export interface PartnerQRCodeResponse {
  id: string;
  qrId: string;
  label: string;
  isActive: boolean;
  scansCount: number;
  createdAt: string;
}

export interface PartnerDetailResponse {
  id: string;
  spotId: string;
  spotSlug: string;
  spotTitle: string;
  spotArea: string;
  status: PartnerStatus;
  tier: PartnerTier;
  brandColor: string;
  benefitText: string | null;
  contractStartDate: string;
  contractEndDate: string | null;
  note: string | null;
  qrCodes: PartnerQRCodeResponse[];
  totalScans: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerRequest {
  spotId: string;
  tier: PartnerTier;
  brandColor: string;
  benefitText?: string;
  contractStartDate: string;
  note?: string;
}

export interface UpdatePartnerRequest {
  tier?: PartnerTier;
  brandColor?: string;
  benefitText?: string;
  contractEndDate?: string;
  note?: string;
  status?: PartnerStatus;
}

export interface PartnerAnalyticsResponse {
  totalScans: number;
  uniqueVisitors: number;
  conversionRate: number;
  lastScanAt: string | null;
  dailyTrend: { date: string; scans: number }[];
}

// ── Blog ──

export type BlogStatus = "DRAFT" | "PUBLISHED";

export interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  status: BlogStatus;
  userName: string;
  userAvatarUrl: string | null;
  spotLineTitle: string;
  spotLineArea: string;
  spotCount: number;
  viewsCount: number;
  likesCount: number;
  publishedAt: string | null;
  createdAt: string;
}

export interface BlogDetailResponse extends BlogListItem {
  spotLineId: string;
  spotLineSlug: string;
  userId: string;
  savesCount: number;
  commentsCount: number;
  updatedAt: string;
}

// ── User (Admin) ──

export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface UserAdminItem {
  id: string;
  email: string;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  suspended: boolean;
  followersCount: number;
  followingCount: number;
  spotsCount: number;
  spotLinesCount: number;
  blogsCount: number;
  createdAt: string;
  suspendedAt: string | null;
}

// ── Bulk Curation ──

export interface BulkMeta {
  tags: string[];
  category: SpotCategory | null;
  area: string | null;
  crewNote: string;
}

export interface BatchStatus {
  batchIndex: number;
  items: CreateSpotRequest[];
  status: "pending" | "processing" | "success" | "failed";
  error?: string;
  successCount?: number;
}

// ── Spring Page (pagination) ──

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-indexed page number
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}

// Spring Page → DataTable Pagination 변환 헬퍼
export function toDataTablePagination(page: SpringPage<unknown>) {
  return {
    current: page.number + 1, // 0-indexed → 1-indexed
    total: page.totalPages,
    limit: page.size,
    count: page.totalElements,
  };
}
