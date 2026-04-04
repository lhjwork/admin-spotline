// Base
export { apiClient } from './base/apiClient';
export type { ApiResponse, PaginationParams, PaginationResponse, BaseFilters, ApiResponseType } from './base/types';

// Admin Management
export { adminAPI } from './admin/adminAPI';

// Media
export { mediaAPI } from './media/mediaAPI';

// v2 APIs (Spring Boot)
export { placeAPI } from './v2/placeAPI';
export { spotAPI } from './v2/spotAPI';
export { spotLineAPI } from './v2/spotLineAPI';

export { apiClient as default } from './base/apiClient';
