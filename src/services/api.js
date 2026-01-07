import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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

// 응답 인터셉터 - 에러 처리 및 응답 변환
api.interceptors.response.use(
  (response) => {
    // 백엔드 응답 형식에 맞게 변환
    if (response.data && typeof response.data === 'object') {
      return response
    }
    return response
  },
  (error) => {
    console.error('API Error:', error)
    
    // 401 에러 시 로그아웃
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_data')
      window.location.href = '/login'
    }
    
    // 에러 메시지 표준화
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        '서버 오류가 발생했습니다.'
    
    return Promise.reject({
      ...error,
      message: errorMessage,
      status: error.response?.status
    })
  }
)

// 🔑 인증 API
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await api.post('/api/admin/login', { 
        username, 
        password 
      })
      
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('admin_token', response.data.data.token)
        localStorage.setItem('admin_data', JSON.stringify(response.data.data.admin))
      }
      
      return response
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },
  
  getProfile: () => api.get('/api/admin/profile'),
  
  verify: () => api.get('/api/admin/verify'),
  
  createAdmin: (data) => api.post('/api/admin/create', data),
  
  logout: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
    return Promise.resolve()
  }
}

// 📊 대시보드 API
export const dashboardAPI = {
  getStats: () => api.get('/api/admin/dashboard/stats')
}

// 🏪 매장 관리 API (운영 매장)
export const operationalStoreAPI = {
  getStores: (params = {}) => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.search && { search: params.search }),
      ...(params.category && { category: params.category }),
      ...(params.status && { status: params.status })
    }
    return api.get('/api/admin/stores', { params: queryParams })
  },
  
  getStore: (id) => api.get(`/api/admin/stores/${id}`),
  
  createStore: (data) => {
    // QR 코드 ID 자동 생성 (real_ 접두사)
    const storeData = {
      ...data,
      qrCode: {
        ...data.qrCode,
        id: data.qrCode?.id || `real_${Date.now().toString().slice(-8)}`
      }
    }
    return api.post('/api/admin/stores', storeData)
  },
  
  updateStore: (id, data) => api.put(`/api/admin/stores/${id}`, data),
  
  toggleStatus: (id, isActive) => 
    api.patch(`/api/admin/stores/${id}/status`, { isActive }),
  
  deleteStore: (id) => api.delete(`/api/admin/stores/${id}`)
}

// 🎯 추천 관리 API
export const recommendationAPI = {
  getRecommendations: (params = {}) => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.fromStore && { fromStore: params.fromStore }),
      ...(params.toStore && { toStore: params.toStore })
    }
    return api.get('/api/admin/recommendations', { params: queryParams })
  },
  
  createRecommendation: (data) => {
    const recommendationData = {
      fromStore: data.fromStore,
      toStore: data.toStore,
      category: data.category,
      priority: data.priority || 5,
      description: data.description,
      tags: data.tags || []
    }
    return api.post('/api/admin/recommendations', recommendationData)
  },
  
  updateRecommendation: (id, data) => 
    api.put(`/api/admin/recommendations/${id}`, data),
  
  deleteRecommendation: (id) => 
    api.delete(`/api/admin/recommendations/${id}`)
}

// 📈 분석 및 통계 API
export const analyticsAPI = {
  getStoreAnalytics: (params = {}) => {
    const queryParams = {
      period: params.period || 'month',
      ...(params.storeId && { storeId: params.storeId })
    }
    return api.get('/api/admin/analytics/stores', { params: queryParams })
  },
  
  getPopularStores: (params = {}) => 
    api.get('/api/admin/analytics/popular-stores', { params }),
  
  getQRPerformance: (params = {}) => 
    api.get('/api/admin/analytics/qr-performance', { params }),
  
  getRecommendationPerformance: (params = {}) => 
    api.get('/api/admin/analytics/recommendation-performance', { params })
}

// SpotLine 시작 설정 API (VERSION003-FINAL 사양)
export const spotlineStartAPI = {
  getConfigs: () => {
    // 임시 목 데이터 - 실제 API 구현 시 교체
    return Promise.resolve({
      data: {
        success: true,
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
      }
    })
  },
  
  createConfig: (data) => {
    // 실제 API 엔드포인트로 교체 필요
    return api.post('/api/admin/experience-configs', data)
  },
  
  updateConfig: (id, data) => 
    api.put(`/api/admin/experience-configs/${id}`, data),
  
  deleteConfig: (id) => 
    api.delete(`/api/admin/experience-configs/${id}`),
  
  getAvailableStores: () => operationalStoreAPI.getStores({ limit: 1000 })
}

// 데모 시스템 API (VERSION003-FINAL 사양 - 읽기 전용)
export const demoSystemAPI = {
  getDemoStores: () => {
    // 임시 목 데이터 - 실제 API 구현 시 교체
    return Promise.resolve({
      data: {
        success: true,
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
      }
    })
  }
}

// 어드민 관리 API
export const adminAPI = {
  getAdmins: () => {
    // 임시 목 데이터 - 실제 API 구현 시 교체
    return Promise.resolve({
      data: {
        success: true,
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
      }
    })
  },
  
  createAdmin: (data) => api.post('/api/admin/admins', data),
  
  updatePermissions: (id, permissions) => 
    api.patch(`/api/admin/admins/${id}/permissions`, { permissions })
}

// 데이터 내보내기 API
export const exportAPI = {
  exportData: (type, format, params = {}) => 
    api.get('/api/admin/export', { 
      params: { type, format, ...params },
      responseType: 'blob'
    })
}

// 지오코딩 API (주소 검색)
export const geocodingAPI = {
  searchAddress: async (query) => {
    const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY
    
    if (!KAKAO_API_KEY || KAKAO_API_KEY === 'YOUR_KAKAO_REST_API_KEY') {
      console.warn('Kakao API key not configured, using mock data')
      return {
        data: {
          documents: [
            {
              address_name: `${query} 검색 결과 (목 데이터)`,
              x: "126.9780",
              y: "37.5665"
            }
          ]
        }
      }
    }
    
    try {
      const response = await axios.get(
        'https://dapi.kakao.com/v2/local/search/address.json',
        {
          params: { query },
          headers: {
            Authorization: `KakaoAK ${KAKAO_API_KEY}`
          }
        }
      )
      return response
    } catch (error) {
      console.error('Geocoding error:', error)
      throw error
    }
  }
}

// 하위 호환성을 위한 별칭
export const storeAPI = operationalStoreAPI

export default api