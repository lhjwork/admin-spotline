// 🔄 통합 API 내보내기
// 각 도메인별로 분리된 API들을 하나의 인터페이스로 제공

// Base
export { apiClient } from './base/apiClient';
export type { ApiResponse, PaginationParams, PaginationResponse, BaseFilters, ApiResponseType } from './base/types';

// Authentication
export { authAPI } from './auth/authAPI';

// Admin Management
export { adminAPI } from './admin/adminAPI';

// Store Management
export { storeAPI } from './stores/storeAPI';
export { operationalStoreAPI } from './stores/operationalStoreAPI';

// Demo System
export { demoAPI } from './demo/demoAPI';

// Live System
export { liveAPI } from './live/liveAPI';

// Recommendations
export { recommendationAPI } from './recommendations/recommendationAPI';

// File Upload
export { s3UploadAPI } from './upload/s3UploadAPI';

// Analytics
export { analyticsAPI } from './analytics/analyticsAPI';

// System Management
export { systemAPI } from './system/systemAPI';

// Dashboard
export { dashboardAPI } from './dashboard/dashboardAPI';

// Geocoding
export { geocodingAPI } from './geocoding/geocodingAPI';

// Experience & SpotLine Start
export { spotlineStartAPI, experienceAPI, experienceConfigAPI } from './experience/experienceAPI';

// Export
export { exportAPI } from './export/exportAPI';

// 하위 호환성을 위한 기본 내보내기
export { apiClient as default } from './base/apiClient';