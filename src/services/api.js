import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 401 에러 시 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_data')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 인증 API
export const authAPI = {
  login: (username, password) => 
    axios.post(`${API_BASE_URL}/api/admin/login`, { username, password }),
}

// 대시보드 API
export const dashboardAPI = {
  getStats: () => api.get('/api/admin/dashboard/stats'),
}

// 매장 관리 API
export const storeAPI = {
  getStores: (params) => api.get('/api/admin/stores', { params }),
  getStore: (id) => api.get(`/api/admin/stores/${id}`),
  createStore: (data) => api.post('/api/admin/stores', data),
  updateStore: (id, data) => api.put(`/api/admin/stores/${id}`, data),
  toggleStatus: (id, isActive) => api.patch(`/api/admin/stores/${id}/status`, { isActive }),
  deleteStore: (id) => api.delete(`/api/admin/stores/${id}`),
}

// 추천 관리 API
export const recommendationAPI = {
  getRecommendations: (params) => api.get('/api/admin/recommendations', { params }),
  createRecommendation: (data) => api.post('/api/admin/recommendations', data),
  updateRecommendation: (id, data) => api.put(`/api/admin/recommendations/${id}`, data),
  deleteRecommendation: (id) => api.delete(`/api/admin/recommendations/${id}`),
}

// 분석 API
export const analyticsAPI = {
  getData: (params) => api.get('/api/admin/analytics', { params }),
  getPopularStores: (params) => api.get('/api/admin/analytics/popular-stores', { params }),
  getQRPerformance: (params) => api.get('/api/admin/analytics/qr-performance', { params }),
  getRecommendationPerformance: (params) => api.get('/api/admin/analytics/recommendation-performance', { params }),
}

// 어드민 관리 API
export const adminAPI = {
  getAdmins: () => api.get('/api/admin/admins'),
  createAdmin: (data) => api.post('/api/admin/admins', data),
  updatePermissions: (id, permissions) => api.patch(`/api/admin/admins/${id}/permissions`, { permissions }),
}

// 데이터 내보내기 API
export const exportAPI = {
  exportData: (type, format, params) => 
    api.get('/api/admin/export', { 
      params: { type, format, ...params },
      responseType: 'blob'
    }),
}

export default api