import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";
import { Info, Mail } from "lucide-react";

export default function SimulationInbox() {
  const { user } = useAuth();
  const { C } = useTheme();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/my-stats")
      .then(() => api.get("/campaigns/", { params: {} }))
      .then(r => {
        const campaigns = r.data?.campaigns || [];
        setAssignments(campaigns.filter(c => c.status === "active" || c.status === "completed"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const demoEmails = [
    {
      id: "demo-1",
      subject: "[URGENT] Your Corporate Account Requires Verification",
      from: "IT Security <security@acmecorp-it-helpdesk.com>",
      preview: "Our security system detected suspicious login attempts from an unrecognized device...",
      time: "2 hours ago",
      token: "demo-token-1",
      unread: true,
    },
    {
      id: "demo-2",
      subject: "HR Policy Update — Acknowledgement Required",
      from: "Human Resources <hr.noreply@acmecorp-hrsystem.com>",
      preview: "As part of our annual compliance cycle, all employees must acknowledge the updated policy...",
      time: "1 day ago",
      token: "demo-token-2",
      unread: false,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Simulation Inbox</h1>
        <p style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>
          Your phishing simulation emails — training only.
        </p>
      </div>

      {/* Notice Banner */}
      <div style={{
        background: `${C.accent}08`,
        border: `1px solid ${C.accent}30`,
        borderRadius: 6,
        padding: "12px 16px",
        marginBottom: 18,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <Info size={14} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 3 }}>Security Awareness Training</div>
          <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.6 }}>
            These are simulated phishing attempts. In a real deployment they arrive in your actual inbox. Identify the red flags, then click Report Phishing to earn points.
          </div>
        </div>
      </div>

      {/* Email List */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.textSec, textTransform: "uppercase", letterSpacing: "0.06em" }}>Inbox ({demoEmails.length})</span>
          <span style={{ fontSize: 10, color: C.textSec }}>Demo mode — real emails sent via SMTP in production</span>
        </div>

        {demoEmails.map(email => (
          <EmailRow key={email.id} email={email} onClick={() => navigate(`/phishing-landing/${email.token}`)} />
        ))}

        {loading && assignments.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", color: C.textSec, fontSize: 12 }}>
            No simulation emails assigned yet.
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, padding: "12px 14px", background: C.inner, border: `1px solid ${C.border}`, borderRadius: 6 }}>
        <span style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
          <span style={{ color: C.text, fontWeight: 600 }}>How to respond:</span> Click an email to view it.
          If you identify it as phishing, press Report Phishing to earn 50 points and lower your vulnerability score.
        </span>
      </div>
    </div>
  );
}

function EmailRow({ email, onClick }) {
  const { C } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", gap: 14, padding: "14px 18px",
        borderBottom: `1px solid ${C.border}`,
        background: hovered ? C.inner : "transparent",
        cursor: "pointer", transition: "background 0.12s",
      }}>
      <div style={{
        width: 34, height: 34, borderRadius: 6,
        background: email.unread ? `${C.accent}15` : C.inner,
        border: `1px solid ${email.unread ? C.accent + "30" : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Mail size={14} color={email.unread ? C.accent : C.textSec} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: C.textSec }}>{email.from}</span>
          <span style={{ fontSize: 10, color: C.textMuted }}>{email.time}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: email.unread ? 600 : 400, color: C.text, marginBottom: 3, display: "flex", alignItems: "center", gap: 7 }}>
          {email.unread && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />}
          {email.subject}
        </div>
        <div style={{ fontSize: 11, color: C.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {email.preview}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: C.warning, background: `${C.warning}10`, border: `1px solid ${C.warning}30`, padding: "2px 8px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Training
        </span>
      </div>
    </div>
  );
}
