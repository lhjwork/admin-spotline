// Base
export { apiClient } from './base/apiClient';
export type { ApiResponse, PaginationParams, PaginationResponse, BaseFilters, ApiResponseType } from './base/types';

// Authentication
export { authAPI } from './auth/authAPI';

// Admin Management
export { adminAPI } from './admin/adminAPI';

// Geocoding
export { geocodingAPI } from './geocoding/geocodingAPI';

// Media
export { mediaAPI } from './media/mediaAPI';

// v2 APIs (Spring Boot)
export { placeAPI } from './v2/placeAPI';
export { spotAPI } from './v2/spotAPI';
export { routeAPI } from './v2/routeAPI';

export { apiClient as default } from './base/apiClient';
