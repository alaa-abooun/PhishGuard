import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard, Users, Mail, BarChart3,
  FileText, Shield, LogOut, Menu, X,
  Trophy, Inbox, Star, Sun, Moon,
} from "lucide-react";

const adminNav = [
  { label: "Dashboard",   path: "/admin",             icon: LayoutDashboard },
  { label: "Campaigns",   path: "/admin/campaigns",   icon: Mail },
  { label: "Users",       path: "/admin/users",       icon: Users },
  { label: "Analytics",   path: "/admin/analytics",   icon: BarChart3 },
  { label: "Reports",     path: "/admin/reports",     icon: FileText },
  { label: "Leaderboard", path: "/admin/leaderboard", icon: Trophy },
];

const employeeNav = [
  { label: "My Dashboard", path: "/employee",              icon: LayoutDashboard },
  { label: "Inbox",        path: "/employee/inbox",        icon: Inbox },
  { label: "My Badges",    path: "/employee/badges",       icon: Star },
  { label: "Leaderboard",  path: "/employee/leaderboard",  icon: Trophy },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { C, isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNav : employeeNav;

  const handleLogout = () => { logout(); navigate("/login"); };

  const isActive = (path) =>
    path === (isAdmin ? "/admin" : "/employee")
      ? location.pathname === path
      : location.pathname.startsWith(path);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 220 : 56,
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarOpen ? "18px 16px" : "18px 12px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, background: C.btnPrimary, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Shield size={15} color="#fff" />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text, letterSpacing: "-0.01em" }}>PhishGuard</div>
              <div style={{ fontSize: 9, color: C.textMuted, marginTop: 1, letterSpacing: "0.08em", textTransform: "uppercase" }}>AI Security Platform</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px" }}>
          {navItems.map(({ label, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 10px", borderRadius: 6, marginBottom: 2,
                  background: active ? C.card : "transparent",
                  color: active ? C.text : C.textSec,
                  cursor: "pointer", transition: "all 0.12s",
                  border: `1px solid ${active ? C.border : "transparent"}`,
                  boxShadow: active ? `0 1px 2px rgba(0,0,0,${isDark ? "0.3" : "0.06"})` : "none",
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"; e.currentTarget.style.color = C.text; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSec; } }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {sidebarOpen && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div style={{ padding: "10px 8px", borderTop: `1px solid ${C.border}` }}>
          {sidebarOpen ? (
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 1 }}>{user?.full_name}</div>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {user?.role === "admin" ? "Administrator" : user?.department}
              </div>
              <button onClick={handleLogout} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", color: C.textSec,
                cursor: "pointer", fontSize: 12, padding: 0,
              }}
                onMouseEnter={e => e.currentTarget.style.color = C.danger}
                onMouseLeave={e => e.currentTarget.style.color = C.textSec}
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", padding: "10px", background: "none",
              border: "none", color: C.textSec, cursor: "pointer",
            }}>
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{
          height: 52, background: C.sidebar,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px", flexShrink: 0,
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: "none", border: "none", color: C.textSec, cursor: "pointer", padding: 4, borderRadius: 4,
          }}>
            {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Role badge */}
            <div style={{
              fontSize: 10, color: C.textMuted,
              background: C.card, border: `1px solid ${C.border}`,
              padding: "4px 10px", borderRadius: 4,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              {user?.role === "admin" ? "Admin" : `Score: ${user?.vulnerability_score}`}
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme} style={{
              width: 32, height: 32,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.textSec,
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.inner; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.textSec; }}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: "auto", padding: "28px 28px", background: C.bg }}>
          {children}
        </main>
      </div>
    </div>
  );
}
