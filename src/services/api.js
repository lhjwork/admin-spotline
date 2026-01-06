import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

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
    axios.post('/api/admin/login', { username, password }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }),
}

// 대시보드 API
export const dashboardAPI = {
  getStats: () => {
    // 임시 목 데이터 반환
    return Promise.resolve({
      data: {
        overview: {
          totalStores: 3,
          totalInactiveStores: 0,
          todayScans: 125,
          weeklyScans: 875,
          monthlyScans: 3500,
          scanGrowth: "+12.5",
          clickThroughRate: "8.5"
        },
        storesByCategory: [
          { _id: "cafe", count: 1 },
          { _id: "restaurant", count: 1 },
          { _id: "culture", count: 1 }
        ],
        recentActivity: [
          {
            id: "1",
            type: "qr_scan",
            store: "카페 스팟라인",
            targetStore: null,
            timestamp: new Date().toISOString()
          },
          {
            id: "2", 
            type: "recommendation_click",
            store: "카페 스팟라인",
            targetStore: "디저트 하우스",
            timestamp: new Date(Date.now() - 300000).toISOString()
          }
        ]
      }
    })
  },
}

// 매장 관리 API
export const storeAPI = {
  getStores: (params) => {
    return api.get('/api/stores', { params }).then(response => {
      // 서버 응답을 프론트엔드 형식에 맞게 변환
      const stores = (response.data.data || response.data).map(store => ({
        ...store,
        // stats 필드가 없으면 기본값 추가
        stats: store.stats || {
          monthlyScans: Math.floor(Math.random() * 1000) + 100,
          weeklyScans: Math.floor(Math.random() * 300) + 50,
          todayScans: Math.floor(Math.random() * 50) + 5
        }
      }))
      
      return {
        data: {
          stores: stores,
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 20,
            count: stores.length,
            total: Math.ceil(stores.length / (params?.limit || 20))
          }
        }
      }
    })
  },
  getStore: (id) => api.get(`/api/stores/${id}`),
  createStore: (data) => api.post('/api/stores', data),
  updateStore: (id, data) => api.put(`/api/stores/${id}`, data),
  toggleStatus: (id, isActive) => api.patch(`/api/stores/${id}/status`, { isActive }),
  deleteStore: (id) => api.delete(`/api/stores/${id}`),
}

// 추천 관리 API
export const recommendationAPI = {
  getRecommendations: (params) => {
    // 임시 목 데이터 반환
    return Promise.resolve({
      data: {
        recommendations: [
          {
            _id: "rec1",
            fromStore: {
              _id: "695b7196c7097cb01017d6a2",
              name: "카페 스팟라인",
              category: "cafe"
            },
            toStore: {
              _id: "695b7196c7097cb01017d6a3", 
              name: "디저트 하우스",
              category: "restaurant"
            },
            category: "dessert",
            priority: 8,
            description: "커피 후 달콤한 디저트는 어떠세요?",
            tags: ["디저트", "가까운", "추천"],
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            _id: "rec2",
            fromStore: {
              _id: "695b7196c7097cb01017d6a2",
              name: "카페 스팟라인", 
              category: "cafe"
            },
            toStore: {
              _id: "695b7196c7097cb01017d6a4",
              name: "아트 갤러리 카페",
              category: "culture"
            },
            category: "culture",
            priority: 7,
            description: "예술 작품을 감상하며 여유로운 시간을 보내세요",
            tags: ["예술", "문화", "조용한"],
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          count: 2,
          total: 1
        }
      }
    })
  },
  createRecommendation: (data) => api.post('/api/recommendations', data),
  updateRecommendation: (id, data) => api.put(`/api/recommendations/${id}`, data),
  deleteRecommendation: (id) => api.delete(`/api/recommendations/${id}`),
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
  getAdmins: () => {
    // 임시 목 데이터 반환
    return Promise.resolve({
      data: [
        {
          _id: "695bad104e53e6bb484d0b35",
          username: "spotline-admin",
          email: "admin@spotline.co.kr", 
          role: "super_admin",
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ]
    })
  },
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