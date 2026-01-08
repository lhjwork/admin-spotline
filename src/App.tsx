import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OperationalStores from "./pages/OperationalStores";
import SpotlineStartSettings from "./pages/SpotlineStartSettings";
import DemoSystem from "./pages/DemoSystem";
import LiveSystem from "./pages/LiveSystem";
import Analytics from "./pages/Analytics";
import SystemSettings from "./pages/SystemSettings";
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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stores" element={<OperationalStores />} />
          <Route path="stores/new" element={<OperationalStores />} />
          <Route path="stores/:id/edit" element={<OperationalStores />} />
          <Route path="operational-stores" element={<OperationalStores />} />
          <Route path="operational-stores/new" element={<OperationalStores />} />
          <Route path="operational-stores/:id/edit" element={<OperationalStores />} />
          <Route path="spotline-start" element={<SpotlineStartSettings />} />
          <Route path="demo" element={<DemoSystem />} />
          <Route path="demo-system" element={<DemoSystem />} />
          <Route path="live-system" element={<LiveSystem />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="system-settings" element={<SystemSettings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
