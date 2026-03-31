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

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
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
          <Route path="partners" element={<PartnerManagement />} />
          <Route path="partners/new" element={<PartnerRegistration />} />
          <Route path="partners/:id" element={<PartnerDetail />} />
          <Route path="admins" element={<Admins />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
