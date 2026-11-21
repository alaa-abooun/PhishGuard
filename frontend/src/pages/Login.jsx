import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { authAPI } from "../services/api";
import { Shield, Eye, EyeOff, AlertCircle, Sun, Moon, X } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const { C, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpForm, setSignUpForm] = useState({ full_name: "", email: "", password: "", department: "" });
  const [signUpShowPw, setSignUpShowPw] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpError("");
    setSignUpLoading(true);
    try {
      const { data } = await authAPI.register(signUpForm);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      toast.success(`Welcome, ${data.user.full_name}!`);
      navigate("/employee");
    } catch (err) {
      setSignUpError(err.response?.data?.error || "Registration failed. Try again.");
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.full_name}`);
      navigate(user.role === "admin" ? "/admin" : "/employee");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === "admin") setForm({ email: "admin@acmecorp.com", password: "Admin@1234" });
    else setForm({ email: "yousef@acmecorp.com", password: "Employee@1234" });
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: "relative",
    }}>
      {/* Theme toggle */}
      <button onClick={toggleTheme} style={{
        position: "absolute", top: 20, right: 20,
        width: 34, height: 34, background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: C.textSec,
      }}>
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, background: C.btnPrimary, borderRadius: 8,
            margin: "0 auto 14px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4, letterSpacing: "-0.01em" }}>
            PhishGuard AI
          </h1>
          <p style={{ color: C.textMuted, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Security Awareness Platform
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "26px 26px",
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 20 }}>Sign In</h2>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: `${C.danger}10`, border: `1px solid ${C.danger}30`,
              borderRadius: 6, padding: "9px 12px", marginBottom: 14,
              color: C.danger, fontSize: 12,
            }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, color: C.textSec, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Email
              </label>
              <input type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                style={{ width: "100%", padding: "9px 12px", background: C.inner, border: `1px solid ${C.borderInput}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.borderInput}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 10, color: C.textSec, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "9px 38px 9px 12px", background: C.inner, border: `1px solid ${C.borderInput}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.borderInput}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: C.textSec, cursor: "pointer",
                }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "10px",
              background: loading ? `${C.btnPrimary}80` : C.btnPrimary,
              border: "none", borderRadius: 6, color: C.btnPrimaryText,
              fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.01em",
            }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 8, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Demo Access
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {["admin", "employee"].map(role => (
                <button key={role} onClick={() => fillDemo(role)} style={{
                  flex: 1, padding: "8px",
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: 5, color: C.textSec,
                  fontSize: 12, cursor: "pointer", textTransform: "capitalize",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ fontSize: 12, color: C.textSec }}>Don't have an account? </span>
          <button onClick={() => { setShowSignUp(true); setSignUpError(""); }} style={{
            background: "none", border: "none", color: C.accent,
            fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0,
          }}>
            Sign Up
          </button>
        </p>

        <p style={{ textAlign: "center", color: C.textMuted, fontSize: 10, marginTop: 12, letterSpacing: "0.03em" }}>
          PhishGuard AI — Security Awareness Training
        </p>
      </div>

      {/* Sign Up Modal */}
      {showSignUp && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
        }} onClick={() => setShowSignUp(false)}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "28px 28px", width: "100%", maxWidth: 400,
          }} onClick={e => e.stopPropagation()}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Create Account</h2>
              <button onClick={() => setShowSignUp(false)} style={{
                background: "none", border: "none", color: C.textSec, cursor: "pointer", padding: 4,
              }}>
                <X size={16} />
              </button>
            </div>

            {signUpError && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: `${C.danger}10`, border: `1px solid ${C.danger}30`,
                borderRadius: 6, padding: "9px 12px", marginBottom: 14,
                color: C.danger, fontSize: 12,
              }}>
                <AlertCircle size={13} /> {signUpError}
              </div>
            )}

            <form onSubmit={handleSignUp}>
              {[
                { key: "full_name", label: "Full Name", type: "text", placeholder: "John Smith" },
                { key: "email", label: "Email", type: "email", placeholder: "you@company.com" },
                { key: "department", label: "Department (optional)", type: "text", placeholder: "IT, HR, Finance…" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 10, color: C.textSec, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {label}
                  </label>
                  <input type={type} value={signUpForm[key]}
                    onChange={e => setSignUpForm({ ...signUpForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    required={key !== "department"}
                    style={{ width: "100%", padding: "9px 12px", background: C.inner, border: `1px solid ${C.borderInput}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e => e.target.style.borderColor = C.borderInput}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 10, color: C.textSec, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input type={signUpShowPw ? "text" : "password"} required value={signUpForm.password}
                    onChange={e => setSignUpForm({ ...signUpForm, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    style={{ width: "100%", padding: "9px 38px 9px 12px", background: C.inner, border: `1px solid ${C.borderInput}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e => e.target.style.borderColor = C.borderInput}
                  />
                  <button type="button" onClick={() => setSignUpShowPw(!signUpShowPw)} style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: C.textSec, cursor: "pointer",
                  }}>
                    {signUpShowPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={signUpLoading} style={{
                width: "100%", padding: "10px",
                background: signUpLoading ? `${C.btnPrimary}80` : C.btnPrimary,
                border: "none", borderRadius: 6, color: C.btnPrimaryText,
                fontSize: 13, fontWeight: 600, cursor: signUpLoading ? "not-allowed" : "pointer",
              }}>
                {signUpLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: C.textSec }}>
              Already have an account?{" "}
              <button onClick={() => setShowSignUp(false)} style={{
                background: "none", border: "none", color: C.accent,
                fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0,
              }}>
                Sign In
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
