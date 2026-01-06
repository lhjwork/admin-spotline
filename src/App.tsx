import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Stores from "./pages/Stores";
import Recommendations from "./pages/Recommendations";
import Analytics from "./pages/Analytics";
import Admins from "./pages/Admins";
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
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
