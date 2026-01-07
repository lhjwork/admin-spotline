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
  login: (username, password) => {
    const API_URL = import.meta.env.VITE_API_URL || ''
    const loginUrl = API_URL ? `${API_URL}/api/admin/login` : '/api/admin/login'
    
    return axios.post(loginUrl, { username, password }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },
}

// 대시보드 API
export const dashboardAPI = {
  getStats: () => {
    // VERSION003-FINAL 대시보드 데이터
    return Promise.resolve({
      data: {
        operationalStores: 3,
        activeQRCodes: 3,
        monthlyStarts: 125,
        monthlyScans: 875,
        systemStatus: {
          demoSystem: true,
          operationalSystem: true,
          spotlineStart: true
        },
        recentActivity: [
          {
            id: "1",
            type: "spotline_start",
            store: "실제 카페명",
            timestamp: new Date().toISOString()
          },
          {
            id: "2", 
            type: "qr_scan",
            store: "실제 카페명",
            timestamp: new Date(Date.now() - 300000).toISOString()
          }
        ]
      }
    })
  },
}

// 운영 매장 관리 API
export const operationalStoreAPI = {
  getStores: (params) => {
    return api.get('/api/admin/stores', { params }).then(response => {
      const stores = (response.data.data || response.data).map(store => ({
        ...store,
        // 운영 매장 전용 필드 추가
        qrCodeId: store.qrCode?.id || `real_${store._id.slice(-8)}`,
        totalScans: store.stats?.totalScans || Math.floor(Math.random() * 1000) + 100,
        lastScanned: store.stats?.lastScanned || new Date(Date.now() - Math.random() * 86400000).toISOString(),
        isOperational: true // 운영 매장 구분
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
  createStore: (data) => {
    // QR 코드 ID 자동 생성 (real_ 접두사)
    const qrCodeId = data.qrCode?.id || `real_${Date.now().toString().slice(-8)}`
    const storeData = {
      ...data,
      qrCode: {
        ...data.qrCode,
        id: qrCodeId,
        isActive: true
      }
    }
    return api.post('/api/admin/stores', storeData)
  },
  updateStore: (id, data) => api.put(`/api/admin/stores/${id}`, data),
  deleteStore: (id) => api.delete(`/api/admin/stores/${id}`),
  toggleStatus: (id, isActive) => api.patch(`/api/admin/stores/${id}/status`, { isActive }),
}

// SpotLine 시작 설정 API
export const spotlineStartAPI = {
  getConfigs: () => {
    return Promise.resolve({
      data: {
        configs: [
          {
            id: "config1",
            name: "기본 시작 설정",
            type: "random",
            targetStores: ["store1", "store2", "store3"],
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ]
      }
    })
  },
  createConfig: (data) => api.post('/api/admin/experience-configs', data),
  updateConfig: (id, data) => api.put(`/api/admin/experience-configs/${id}`, data),
  deleteConfig: (id) => api.delete(`/api/admin/experience-configs/${id}`),
  getAvailableStores: () => operationalStoreAPI.getStores({ limit: 1000 })
}

// 데모 시스템 API (읽기 전용)
export const demoSystemAPI = {
  getDemoStores: () => {
    return Promise.resolve({
      data: {
        stores: [
          {
            id: "demo1",
            name: "카페 데모",
            qrCodeId: "demo_cafe_001",
            area: "강남역",
            isDemoOnly: true,
            shortDescription: "데모용 카페입니다"
          },
          {
            id: "demo2", 
            name: "레스토랑 데모",
            qrCodeId: "demo_restaurant_001",
            area: "홍대입구",
            isDemoOnly: true,
            shortDescription: "데모용 레스토랑입니다"
          }
        ],
        demoLinks: {
          experience: "/api/demo/experience",
          stores: "/api/demo/stores"
        }
      }
    })
  }
}

// 기존 storeAPI는 operationalStoreAPI로 대체됨
export const storeAPI = operationalStoreAPI // 하위 호환성을 위해 유지

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