import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, TestTube, Settings, BarChart3, LogOut, Menu, X, LucideIcon, ArrowLeft, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface DemoNavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const demoNavigation: DemoNavigationItem[] = [
  { name: "데모 대시보드", href: "/demo", icon: LayoutDashboard },
  { name: "데모 매장 관리", href: "/demo/stores", icon: TestTube },
  { name: "체험 설정", href: "/demo/experience-configs", icon: Settings },
  { name: "사용 현황", href: "/demo/analytics", icon: BarChart3 },
];

export default function DemoLayout() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleBackToMain = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-orange-50">
      {/* 모바일 사이드바 */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white border-r-4 border-orange-400">
          <div className="flex h-16 items-center justify-between px-4 bg-orange-100">
            <div className="flex items-center space-x-2">
              <TestTube className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-bold text-orange-900">데모 관리</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* 데모 모드 안내 */}
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-yellow-800">데모 모드</p>
                <p className="text-yellow-700">업주 소개용 시스템</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {demoNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 실제 운영으로 돌아가기 */}
          <div className="p-4 border-t border-gray-200">
            <button onClick={handleBackToMain} className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              <ArrowLeft className="h-4 w-4" />
              <span>실제 운영 관리로</span>
            </button>
          </div>
        </div>
      </div>

      {/* 데스크톱 사이드바 */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r-4 border-orange-400">
          <div className="flex h-16 items-center px-4 bg-orange-100">
            <div className="flex items-center space-x-2">
              <TestTube className="h-6 w-6 text-orange-600" />
              <h1 className="text-xl font-bold text-orange-900">데모 관리</h1>
            </div>
          </div>

          {/* 데모 모드 안내 */}
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-yellow-800">데모 모드</p>
                <p className="text-yellow-700">업주 소개용 시스템입니다</p>
                <p className="text-yellow-700">사용자 데이터를 수집하지 않습니다</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {demoNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 실제 운영으로 돌아가기 */}
          <div className="p-4 border-t border-gray-200">
            <button onClick={handleBackToMain} className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              <ArrowLeft className="h-4 w-4" />
              <span>실제 운영 관리로</span>
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="lg:pl-64">
        {/* 상단 헤더 */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TestTube className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">데모 관리 모드</span>
              </div>
              <span className="text-sm text-gray-700">
                {admin?.username} ({admin?.role})
              </span>
              <button onClick={logout} className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700">
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>

        {/* 페이지 콘텐츠 */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
