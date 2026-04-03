import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SpotCuration from "./pages/SpotCuration";
import SpotManagement from "./pages/SpotManagement";
import RouteBuilder from "./pages/RouteBuilder";
import RouteManagement from "./pages/RouteManagement";
import Admins from "./pages/Admins";
import PartnerManagement from "./pages/PartnerManagement";
import PartnerRegistration from "./pages/PartnerRegistration";
import PartnerDetail from "./pages/PartnerDetail";
import { ReactNode } from "react";
import type { AdminRole } from "./types";
import { hasMinRole } from "./utils/roles";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AdminRole;
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg text-center">
        <h3 className="font-semibold mb-1">접근 권한이 없습니다</h3>
        <p className="text-sm">이 페이지를 보려면 상위 권한이 필요합니다.</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, admin } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;

  if (requiredRole && admin && !hasMinRole(admin.role, requiredRole)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="curation" element={<SpotCuration />} />
          <Route path="spots" element={<SpotManagement />} />
          <Route path="routes/new" element={<RouteBuilder />} />
          <Route path="routes/:slug/edit" element={<RouteBuilder />} />
          <Route path="routes" element={<RouteManagement />} />
          <Route path="partners" element={
            <ProtectedRoute requiredRole="admin"><PartnerManagement /></ProtectedRoute>
          } />
          <Route path="partners/new" element={
            <ProtectedRoute requiredRole="admin"><PartnerRegistration /></ProtectedRoute>
          } />
          <Route path="partners/:id" element={
            <ProtectedRoute requiredRole="admin"><PartnerDetail /></ProtectedRoute>
          } />
          <Route path="admins" element={
            <ProtectedRoute requiredRole="super_admin"><Admins /></ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
