import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const adminData = localStorage.getItem('admin_data')
    
    if (token && adminData) {
      setAdmin(JSON.parse(adminData))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password)
      
      // 가이드 형식에 맞춰 응답 구조 확인
      const responseData = response.data
      const token = responseData.success ? responseData.data.token : responseData.token
      const adminData = responseData.success ? responseData.data.admin : responseData.admin
      
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_data', JSON.stringify(adminData))
      
      setAdmin(adminData)
      setIsAuthenticated(true)
      
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      let errorMessage = '로그인에 실패했습니다'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
    setAdmin(null)
    setIsAuthenticated(false)
  }

  const value = {
    admin,
    isAuthenticated,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}