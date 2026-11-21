import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import PhishingLanding from "./pages/PhishingLanding";
import TrainingPage from "./pages/TrainingPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import CampaignList from "./pages/admin/CampaignList";
import CreateCampaign from "./pages/admin/CreateCampaign";
import CampaignDetail from "./pages/admin/CampaignDetail";
import UsersManagement from "./pages/admin/UsersManagement";
import Analytics from "./pages/admin/Analytics";
import Reports from "./pages/admin/Reports";
import Leaderboard from "./pages/admin/Leaderboard";

import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import SimulationInbox from "./pages/employee/SimulationInbox";
import BadgesPage from "./pages/employee/BadgesPage";
import EmployeeLeaderboard from "./pages/employee/EmployeeLeaderboard";

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/employee"} replace />;
  }
  return <Layout>{children}</Layout>;
}

function LoadingScreen() {
  const { C } = useTheme();
  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ color: C.textSec, fontSize: 13 }}>Loading PhishGuard AI</div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { C } = useTheme();
  if (loading) return <LoadingScreen />;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/employee"} /> : <Login />} />
        <Route path="/phishing-landing/:token" element={<PhishingLanding />} />
        <Route path="/training/:token" element={<TrainingPage />} />

        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/campaigns" element={<ProtectedRoute requiredRole="admin"><CampaignList /></ProtectedRoute>} />
        <Route path="/admin/campaigns/new" element={<ProtectedRoute requiredRole="admin"><CreateCampaign /></ProtectedRoute>} />
        <Route path="/admin/campaigns/:id" element={<ProtectedRoute requiredRole="admin"><CampaignDetail /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UsersManagement /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><Analytics /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin"><Reports /></ProtectedRoute>} />
        <Route path="/admin/leaderboard" element={<ProtectedRoute requiredRole="admin"><Leaderboard /></ProtectedRoute>} />

        <Route path="/employee" element={<ProtectedRoute requiredRole="employee"><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/employee/inbox" element={<ProtectedRoute requiredRole="employee"><SimulationInbox /></ProtectedRoute>} />
        <Route path="/employee/badges" element={<ProtectedRoute requiredRole="employee"><BadgesPage /></ProtectedRoute>} />
        <Route path="/employee/leaderboard" element={<ProtectedRoute requiredRole="employee"><EmployeeLeaderboard /></ProtectedRoute>} />

        <Route path="/" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/employee"} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{
        style: { background: C.card, color: C.text, border: `1px solid ${C.border}`, fontSize: 13 },
        success: { iconTheme: { primary: C.success, secondary: "#fff" } },
        error: { iconTheme: { primary: C.danger, secondary: "#fff" } },
      }} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
