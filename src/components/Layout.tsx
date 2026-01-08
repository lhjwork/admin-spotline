import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, Store, BarChart3, Users, LogOut, Menu, X, ArrowRight, LucideIcon, TestTube } from "lucide-react";
import { useState } from "react";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  section?: string;
}

const navigation: NavigationItem[] = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },

  // 실제 운영 섹션
  { name: "매장 관리", href: "/stores", icon: Store, section: "real" },
  { name: "추천 관리", href: "/recommendations", icon: ArrowRight, section: "real" },
  { name: "분석", href: "/analytics", icon: BarChart3, section: "real" },

  // 시스템 섹션
  { name: "어드민 관리", href: "/admins", icon: Users, section: "system" },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 사이드바 */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Spotline Admin</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* 대시보드 */}
            {navigation
              .filter((item) => !item.section)
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}

            {/* 실제 운영 섹션 */}
            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">실제 운영</h3>
              <div className="mt-2 space-y-1">
                {navigation
                  .filter((item) => item.section === "real")
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* 데모 시스템 전환 버튼 */}
            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">데모 시스템</h3>
              <div className="mt-2">
                <button
                  onClick={() => {
                    navigate("/demo");
                    setSidebarOpen(false);
                  }}
                  className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-orange-50 hover:text-orange-700 border border-orange-200 hover:border-orange-300"
                >
                  <TestTube className="mr-3 h-5 w-5" />
                  <span>데모 관리 모드</span>
                  <ArrowRight className="ml-auto h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 시스템 섹션 */}
            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">시스템</h3>
              <div className="mt-2 space-y-1">
                {navigation
                  .filter((item) => item.section === "system")
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* 데스크톱 사이드바 */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Spotline Admin</h1>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* 대시보드 */}
            {navigation
              .filter((item) => !item.section)
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}

            {/* 실제 운영 섹션 */}
            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">실제 운영</h3>
              <div className="mt-2 space-y-1">
                {navigation
                  .filter((item) => item.section === "real")
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* 데모 시스템 전환 버튼 */}
            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">데모 시스템</h3>
              <div className="mt-2">
                <button
                  onClick={() => navigate("/demo")}
                  className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-orange-50 hover:text-orange-700 border border-orange-200 hover:border-orange-300"
                >
                  <TestTube className="mr-3 h-5 w-5" />
                  <span>데모 관리 모드</span>
                  <ArrowRight className="ml-auto h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 시스템 섹션 */}
            <div className="pt-4">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">시스템</h3>
              <div className="mt-2 space-y-1">
                {navigation
                  .filter((item) => item.section === "system")
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
              </div>
            </div>
          </nav>
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
