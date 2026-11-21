/**
 * Just-in-Time Training Page
 * Shown after a user submits fake credentials on the phishing landing page.
 */
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Search, Clock, Link2, Phone, Flag, ShieldOff } from "lucide-react";

export default function TrainingPage() {
  const { C } = useTheme();
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const redFlags = state.red_flags || [
    "Suspicious sender domain — not the official company email",
    "Artificial urgency — '2 hours or account locked'",
    "Link doesn't go to the official corporate login portal",
    "Generic greeting instead of your real name",
    "Threat of negative consequences to force action",
  ];

  const scoreDelta = state.score_delta || 25;

  const lessons = [
    { icon: Search, title: "Check the Sender Domain",     body: "Always inspect the full email address, not just the display name. 'acmecorp-it-helpdesk.com' is NOT 'acmecorp.com'. Attackers add words to make fake domains look real." },
    { icon: Clock,  title: "Urgency is a Red Flag",        body: "Phishers create artificial deadlines to prevent careful thinking. Real IT departments never give 2-hour windows for password resets." },
    { icon: Link2,  title: "Verify Links Before Clicking",  body: "Hover over any link to see the real destination URL in your status bar. If it doesn't match your company's exact domain, don't click." },
    { icon: Phone,  title: "When in Doubt, Call",           body: "If you receive an unexpected urgent request, call the sender directly using a known number — never use contact info from the suspicious email." },
    { icon: Flag,   title: "Use the Report Button",         body: "Your email client has a Report Phishing option. Using it protects you and your colleagues, and earns you security awareness points." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', 'Segoe UI', sans-serif", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: `${C.danger}08`, borderBottom: `1px solid ${C.danger}20`, padding: "36px 20px", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: `${C.danger}20`, border: `1px solid ${C.danger}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <ShieldOff size={22} color={C.danger} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: "-0.01em" }}>
          You Were Phished
        </h1>
        <p style={{ color: C.textSec, fontSize: 13, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
          This was a <strong style={{ color: C.danger }}>simulated phishing training exercise</strong>. You submitted credentials on a fake login page. Your real passwords are safe — this was a controlled simulation.
        </p>
        <div style={{
          display: "inline-block",
          background: `${C.danger}15`,
          border: `1px solid ${C.danger}30`,
          borderRadius: 4,
          padding: "5px 14px",
          marginTop: 14,
          fontSize: 12,
          color: C.danger,
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}>
          Vulnerability Score +{scoreDelta} points
        </div>
      </div>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 20px" }}>
        {/* Red Flags */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.danger}`, borderRadius: 8, padding: 22, marginTop: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Red Flags You Missed
          </h2>
          {redFlags.map((flag, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, marginBottom: 10,
              background: `${C.danger}06`,
              borderLeft: `2px solid ${C.danger}40`,
              padding: "8px 12px", borderRadius: 4,
            }}>
              <span style={{ color: C.danger, fontWeight: 700, flexShrink: 0, fontSize: 12 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5, opacity: 0.85 }}>{flag}</span>
            </div>
          ))}
        </div>

        {/* Lessons */}
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            What To Do Next Time
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {lessons.map((l, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                <l.icon size={16} color={C.accent} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>{l.title}</div>
                <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.7 }}>{l.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Complete */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 22, marginTop: 20, textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: `${C.success}15`, border: `1px solid ${C.success}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Flag size={18} color={C.success} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>Training Module Complete</h3>
          <p style={{ fontSize: 12, color: C.textSec, marginBottom: 18, lineHeight: 1.7 }}>
            Remember these lessons the next time you receive a suspicious email. Reporting phishing correctly earns you 50 points.
          </p>
          <button onClick={() => navigate("/employee")} style={{
            padding: "10px 28px",
            background: C.btnPrimary,
            border: "none",
            borderRadius: 6,
            color: C.btnPrimaryText,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            letterSpacing: "0.01em",
          }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
