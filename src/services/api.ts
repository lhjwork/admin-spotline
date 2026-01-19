// 🔄 하위 호환성을 위한 API 재내보내기
// 기존 import 구문들이 계속 작동하도록 모든 API를 재내보내기

export * from './index';

// 기존 코드와의 호환성을 위해 개별 API들도 내보내기
export { authAPI } from './auth/authAPI';
export { adminAPI } from './admin/adminAPI';
export { storeAPI } from './stores/storeAPI';
export { operationalStoreAPI } from './stores/operationalStoreAPI';
export { demoAPI } from './demo/demoAPI';
export { liveAPI } from './live/liveAPI';
export { recommendationAPI } from './recommendations/recommendationAPI';
export { s3UploadAPI } from './upload/s3UploadAPI';
export { analyticsAPI } from './analytics/analyticsAPI';
export { systemAPI } from './system/systemAPI';
export { dashboardAPI } from './dashboard/dashboardAPI';
export { geocodingAPI } from './geocoding/geocodingAPI';
export { spotlineStartAPI, experienceAPI, experienceConfigAPI } from './experience/experienceAPI';
export { exportAPI } from './export/exportAPI';

// 기본 내보내기
export { apiClient as default } from './base/apiClient';