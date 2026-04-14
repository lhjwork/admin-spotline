import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard, Search, MapPin, Route, List,
  Users, LogOut, Menu, X, Store, Shield, FileText, BarChart3, LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AdminRole } from "../types";
import { hasMinRole, getRoleLabel } from "../utils/roles";
import { reportAPI } from "../services/v2/reportAPI";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  section?: string;
  minRole?: AdminRole;
}

const navigation: NavigationItem[] = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },

  // 분석 섹션
  { name: "분석", href: "/analytics", icon: BarChart3, section: "analytics", minRole: "admin" as AdminRole },

  // 큐레이션 섹션
  { name: "Spot 큐레이션", href: "/curation", icon: Search, section: "curation" },
  { name: "Spot 관리", href: "/spots", icon: MapPin, section: "curation" },
  { name: "SpotLine 빌더", href: "/spotlines/new", icon: Route, section: "curation" },
  { name: "SpotLine 관리", href: "/spotlines", icon: List, section: "curation" },

  // 콘텐츠 섹션
  { name: "블로그 관리", href: "/blogs", icon: FileText, section: "content", minRole: "admin" },

  // 파트너 섹션
  { name: "파트너 관리", href: "/partners", icon: Store, section: "partner", minRole: "admin" },

  // 시스템 섹션
  { name: "유저 관리", href: "/users", icon: Users, section: "system", minRole: "admin" },
  { name: "모더레이션", href: "/moderation", icon: Shield, section: "system", minRole: "admin" },
  { name: "어드민 관리", href: "/admins", icon: Users, section: "system", minRole: "super_admin" },
];

function NavLink({ item, onClick, badge }: { item: NavigationItem; onClick?: () => void; badge?: number }) {
  const location = useLocation();
  const Icon = item.icon;
  const isActive =
    location.pathname === item.href ||
    (item.href !== "/dashboard" && item.href !== "/spotlines/new" && location.pathname.startsWith(item.href));

  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
        isActive ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon className="mr-3 h-5 w-5" />
      {item.name}
      {badge != null && badge > 0 && (
        <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({ title, section, onClick, badgeMap }: { title: string; section: string; onClick?: () => void; badgeMap?: Record<string, number> }) {
  const { admin } = useAuth();
  const items = navigation.filter((item) => {
    if (item.section !== section) return false;
    if (item.minRole && admin) return hasMinRole(admin.role, item.minRole);
    return true;
  });

  if (items.length === 0) return null;

  return (
    <div className="pt-4">
      <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <NavLink key={item.name} item={item} onClick={onClick} badge={badgeMap?.[item.href]} />
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const { admin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const close = () => setSidebarOpen(false);

  const { data: pendingCount } = useQuery({
    queryKey: ["reports-pending-count"],
    queryFn: () => reportAPI.getPendingCount(),
    select: (res) => res.data.count,
    refetchInterval: 60000,
  });

  const systemBadgeMap: Record<string, number> = pendingCount ? { "/moderation": pendingCount } : {};

  const sidebarContent = (onNav?: () => void) => (
    <>
      {navigation.filter((i) => {
        if (i.section) return false;
        if (i.minRole && admin) return hasMinRole(admin.role, i.minRole);
        return true;
      }).map((item) => (
        <NavLink key={item.name} item={item} onClick={onNav} />
      ))}
      <NavSection title="분석" section="analytics" onClick={onNav} />
      <NavSection title="큐레이션" section="curation" onClick={onNav} />
      <NavSection title="콘텐츠" section="content" onClick={onNav} />
      <NavSection title="파트너" section="partner" onClick={onNav} />
      <NavSection title="시스템" section="system" onClick={onNav} badgeMap={systemBadgeMap} />
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 사이드바 */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={close} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Spotline Admin</h1>
            <button onClick={close}><X className="h-6 w-6" /></button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">{sidebarContent(close)}</nav>
        </div>
      </div>

      {/* 데스크톱 사이드바 */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Spotline Admin</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">{sidebarContent()}</nav>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {admin?.username} ({admin ? getRoleLabel(admin.role) : ""})
              </span>
              <button onClick={logout} className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700">
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
