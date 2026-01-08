import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import DemoLayout from "./components/DemoLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Stores from "./pages/Stores";
import Recommendations from "./pages/Recommendations";
import Analytics from "./pages/Analytics";
import Admins from "./pages/Admins";
import ExperienceConfigs from "./pages/ExperienceConfigs";
import DemoDashboard from "./pages/demo/DemoDashboard";
import DemoStores from "./pages/demo/DemoStores";
import DemoExperienceConfigs from "./pages/demo/DemoExperienceConfigs";
import DemoAnalytics from "./pages/demo/DemoAnalytics";
import ExtensionDetector from "./components/ExtensionDetector";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <ExtensionDetector />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* 실제 운영 관리 (메인) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stores" element={<Stores />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="admins" element={<Admins />} />
          <Route path="experience-configs" element={<ExperienceConfigs />} />
        </Route>

        {/* 데모 시스템 관리 (별도 레이아웃) */}
        <Route
          path="/demo"
          element={
            <ProtectedRoute>
              <DemoLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DemoDashboard />} />
          <Route path="stores" element={<DemoStores />} />
          <Route path="experience-configs" element={<DemoExperienceConfigs />} />
          <Route path="analytics" element={<DemoAnalytics />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
