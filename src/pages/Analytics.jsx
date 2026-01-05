import { useState } from 'react'
import { useQuery } from 'react-query'
import { analyticsAPI } from '../services/api'
import { 
  Calendar,
  Download,
  TrendingUp,
  MousePointer,
  QrCode
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format, subDays } from 'date-fns'

export default function Analytics() {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })
  
  const [period, setPeriod] = useState('30d')

  // 분석 데이터 조회
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery(
    ['analytics', dateRange],
    () => analyticsAPI.getData(dateRange),
    {
      select: (response) => response.data
    }
  )

  // 인기 매장 조회
  const { data: popularStores, isLoading: popularLoading } = useQuery(
    ['popular-stores', period],
    () => analyticsAPI.getPopularStores({ period }),
    {
      select: (response) => response.data
    }
  )

  // QR 성과 조회
  const { data: qrPerformance, isLoading: qrLoading } = useQuery(
    ['qr-performance', period],
    () => analyticsAPI.getQRPerformance({ period }),
    {
      select: (response) => response.data
    }
  )

  // 추천 성과 조회
  const { data: recommendationPerformance, isLoading: recLoading } = useQuery(
    ['recommendation-performance', period],
    () => analyticsAPI.getRecommendationPerformance({ period }),
    {
      select: (response) => response.data
    }
  )

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 일별 통계 차트 데이터 변환
  const chartData = analyticsData?.dailyStats?.reduce((acc, stat) => {
    const date = stat._id.date
    const existing = acc.find(item => item.date === date)
    
    if (existing) {
      existing[stat._id.eventType] = stat.count
    } else {
      acc.push({
        date,
        [stat._id.eventType]: stat.count
      })
    }
    
    return acc
  }, []) || []

  if (analyticsLoading || popularLoading || qrLoading || recLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">분석</h1>
          <p className="text-gray-600">서비스 사용 현황과 성과를 분석하세요</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
          </select>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
            <Download className="h-4 w-4" />
            <span>내보내기</span>
          </button>
        </div>
      </div>

      {/* 날짜 범위 선택 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* 일별 활동 차트 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">일별 활동 현황</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="qr_scan" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="QR 스캔"
            />
            <Line 
              type="monotone" 
              dataKey="recommendation_click" 
              stroke="#10b981" 
              strokeWidth={2}
              name="추천 클릭"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 매장 순위 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">인기 매장 순위</h3>
          <div className="space-y-3">
            {popularStores?.slice(0, 10).map((store, index) => (
              <div key={store._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{store.store.name}</p>
                    <p className="text-xs text-gray-500">{store.store.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{store.scanCount}회</p>
                  <p className="text-xs text-gray-500">{store.uniqueVisitors}명</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR 성과 분석 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">QR 코드 성과</h3>
          <div className="space-y-3">
            {qrPerformance?.slice(0, 10).map((qr) => (
              <div key={qr.qrCode} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{qr.qrCode}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>스캔: {qr.totalScans}</span>
                      <span>클릭: {qr.recommendationClicks}</span>
                      <span>방문자: {qr.uniqueVisitors}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {qr.clickThroughRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">클릭률</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 추천 성과 분석 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">추천 성과 분석</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  출발 매장
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  추천 매장
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  클릭 수
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recommendationPerformance?.map((rec, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rec.fromStoreName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rec.toStoreName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rec.clickCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}