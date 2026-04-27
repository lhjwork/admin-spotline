import { lazy, Suspense, ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import type { AdminRole } from "./types";
import { hasMinRole } from "./utils/roles";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SpotCuration = lazy(() => import("./pages/SpotCuration"));
const SpotManagement = lazy(() => import("./pages/SpotManagement"));
const SpotLineBuilder = lazy(() => import("./pages/SpotLineBuilder"));
const SpotLineManagement = lazy(() => import("./pages/SpotLineManagement"));
const Admins = lazy(() => import("./pages/Admins"));
const PartnerManagement = lazy(() => import("./pages/PartnerManagement"));
const PartnerRegistration = lazy(() => import("./pages/PartnerRegistration"));
const PartnerDetail = lazy(() => import("./pages/PartnerDetail"));
const PartnerEdit = lazy(() => import("./pages/PartnerEdit"));
const ModerationQueue = lazy(() => import("./pages/ModerationQueue"));
const UserContentReview = lazy(() => import("./pages/UserContentReview"));
const BlogManagement = lazy(() => import("./pages/BlogManagement"));
const Analytics = lazy(() => import("./pages/Analytics"));
const CheckinAnalytics = lazy(() => import("./pages/CheckinAnalytics"));
const ShareAnalytics = lazy(() => import("./pages/ShareAnalytics"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const CollectionManagement = lazy(() => import("./pages/CollectionManagement"));
const CollectionEditor = lazy(() => import("./pages/CollectionEditor"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

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
          <Route path="dashboard" element={<Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense>} />
          <Route path="curation" element={<Suspense fallback={<LoadingSpinner />}><SpotCuration /></Suspense>} />
          <Route path="spots" element={<Suspense fallback={<LoadingSpinner />}><SpotManagement /></Suspense>} />
          <Route path="spotlines/new" element={<Suspense fallback={<LoadingSpinner />}><SpotLineBuilder /></Suspense>} />
          <Route path="spotlines/:slug/edit" element={<Suspense fallback={<LoadingSpinner />}><SpotLineBuilder /></Suspense>} />
          <Route path="spotlines" element={<Suspense fallback={<LoadingSpinner />}><SpotLineManagement /></Suspense>} />
          <Route path="collections" element={<Suspense fallback={<LoadingSpinner />}><CollectionManagement /></Suspense>} />
          <Route path="collections/new" element={<Suspense fallback={<LoadingSpinner />}><CollectionEditor /></Suspense>} />
          <Route path="collections/:slug/edit" element={<Suspense fallback={<LoadingSpinner />}><CollectionEditor /></Suspense>} />
          <Route path="analytics" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><Analytics /></Suspense></ProtectedRoute>
          } />
          <Route path="checkin-analytics" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><CheckinAnalytics /></Suspense></ProtectedRoute>
          }/>
          <Route path="share-analytics" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><ShareAnalytics /></Suspense></ProtectedRoute>
          } />
          <Route path="blogs" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><BlogManagement /></Suspense></ProtectedRoute>
          } />
          <Route path="blogs/:slug" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><BlogDetail /></Suspense></ProtectedRoute>
          } />
          <Route path="partners" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><PartnerManagement /></Suspense></ProtectedRoute>
          } />
          <Route path="partners/new" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><PartnerRegistration /></Suspense></ProtectedRoute>
          } />
          <Route path="partners/:id/edit" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><PartnerEdit /></Suspense></ProtectedRoute>
          } />
          <Route path="partners/:id" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><PartnerDetail /></Suspense></ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><UserManagement /></Suspense></ProtectedRoute>
          } />
          <Route path="user-content-review" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><UserContentReview /></Suspense></ProtectedRoute>
          } />
          <Route path="moderation" element={
            <ProtectedRoute requiredRole="admin"><Suspense fallback={<LoadingSpinner />}><ModerationQueue /></Suspense></ProtectedRoute>
          } />
          <Route path="admins" element={
            <ProtectedRoute requiredRole="super_admin"><Suspense fallback={<LoadingSpinner />}><Admins /></Suspense></ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
