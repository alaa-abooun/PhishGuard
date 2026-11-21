/**
 * Simulated Phishing Landing Page
 * IMPORTANT: Credentials are NEVER stored. Only the fact of submission is logged.
 *
 * Note: The fake login form is intentionally styled to look like a real corporate page
 * (light/neutral) regardless of the user's theme — that is part of the simulation.
 * Only the simulation banner at the top uses the app theme.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trackingAPI } from "../services/api";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";

export default function PhishingLanding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [landingData, setLandingData] = useState(null);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackingAPI.getLandingData(token)
      .then(r => setLandingData(r.data))
      .catch(() => setLandingData({ email_subject: "Verify Your Account", sender_name: "IT Support", user_name: "Employee" }))
      .finally(() => setLoading(false));
  }, [token]);

  const handleReport = async () => {
    try {
      const { data } = await trackingAPI.reportPhishing(token);
      toast.success(data.message);
      navigate("/employee");
    } catch {
      toast.success("Phishing reported. Great job.");
      navigate("/employee");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await trackingAPI.submitFakeCredentials(token);
      navigate(`/training/${token}`, { state: { red_flags: data.red_flags, score_delta: data.score_delta } });
    } catch {
      navigate(`/training/${token}`);
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#64748b", fontSize: 13 }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Simulation Banner — app UI */}
      <div style={{
        background: "#fef3c7",
        borderBottom: "2px solid #d97706",
        padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        fontSize: 12, fontWeight: 600, color: "#92400e",
      }}>
        <AlertTriangle size={14} color="#d97706" />
        SECURITY AWARENESS SIMULATION — This is a controlled training exercise.
        <button onClick={handleReport} style={{
          padding: "4px 12px",
          background: "#16a34a", border: "none", borderRadius: 4,
          color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>
          Report as Phishing
        </button>
      </div>

      {/* Fake Corporate Login Page — intentionally light-styled */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
        <div style={{
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 10, padding: "36px 32px", width: "100%", maxWidth: 400,
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
        }}>
          {/* Fake company logo */}
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10, margin: "0 auto 12px",
              background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, color: "#fff", fontSize: 18, letterSpacing: "-0.01em",
            }}>
              AC
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
              Corporate Account Portal
            </h2>
            <p style={{ fontSize: 12, color: "#64748b" }}>
              {landingData?.sender_name || "IT Support"} — Sign in to continue
            </p>
          </div>

          {/* Red Flag Hint */}
          <div style={{
            background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 5,
            padding: "8px 12px", marginBottom: 18, fontSize: 11, color: "#9a3412",
          }}>
            <strong>Red Flag:</strong> URL would show <code style={{ background: "#ffedd5", padding: "1px 4px", borderRadius: 3 }}>acmecorp-it-helpdesk.com</code> — a fake domain.
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#374151", display: "block", marginBottom: 5, fontWeight: 600 }}>
                Corporate Email / Username
              </label>
              <input type="text" value={formData.username}
                onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                placeholder="your.name@company.com"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, color: "#374151", display: "block", marginBottom: 5, fontWeight: 600 }}>
                Password
              </label>
              <input type="password" value={formData.password}
                onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                Simulation: form values are never transmitted or stored
              </p>
            </div>
            <button type="submit" disabled={submitting} style={{
              width: "100%", padding: "10px",
              background: "#1e40af", border: "none", borderRadius: 6,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ marginTop: 18, textAlign: "center" }}>
            <button onClick={handleReport} style={{
              background: "none", border: "none", color: "#16a34a",
              fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline",
            }}>
              This looks suspicious — Report Phishing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
