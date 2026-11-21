import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { analyticsAPI, gamificationAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ScoreGauge from "../../components/ScoreGauge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CheckCircle, AlertTriangle, ShieldOff } from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { C } = useTheme();
  const [stats, setStats] = useState(null);
  const [myBadges, setMyBadges] = useState(null);

  useEffect(() => {
    Promise.all([analyticsAPI.myStats(), gamificationAPI.myBadges(), gamificationAPI.leaderboard(5)])
      .then(([s, b]) => { setStats(s.data); setMyBadges(b.data); })
      .catch(console.error);
  }, []);

  const score = user?.vulnerability_score ?? 50;
  const riskColor = score <= 30 ? C.danger : score <= 70 ? C.warning : C.success;
  const riskStatus = score <= 30 ? "Needs Improvement" : score <= 70 ? "Progressing" : "Good Awareness";
  const trendData = stats?.score_history?.map((h, i) => ({ i: i + 1, score: h.new_score })) || [];
  const TT = { background: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, color: C.text, fontSize: 11, borderRadius: 6 };

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Welcome, {user?.full_name?.split(" ")[0]}</h1>
        <p style={{ color: C.textSec, fontSize: 12, marginTop: 4 }}>Your phishing awareness dashboard</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 14, marginBottom: 18 }}>
        {/* Score */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px", textAlign: "center" }}>
          <ScoreGauge score={score} />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: C.textSec, textTransform: "uppercase", letterSpacing: "0.06em" }}>Vulnerability Score</div>
            <div style={{ fontSize: 11, color: riskColor, fontWeight: 600, marginTop: 3 }}>{riskStatus}</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: C.textSec, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>My Progress</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Points",  value: user?.points || 0,              color: C.warning },
              { label: "Badges",  value: myBadges?.earned?.length || 0,  color: C.accent },
              { label: "Reports", value: stats?.interactions?.reported || 0, color: C.success },
              { label: "Rank",    value: `#${myBadges?.points_rank || "—"}`, color: C.text },
            ].map(item => (
              <div key={item.label} style={{ background: C.inner, borderRadius: 6, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: item.color, letterSpacing: "-0.01em" }}>{item.value}</div>
                <div style={{ fontSize: 10, color: C.textSec, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Link to="/employee/badges" style={{ textDecoration: "none", flex: 1 }}>
              <button style={{ width: "100%", padding: "8px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 5, color: C.textSec, fontSize: 11, cursor: "pointer" }}>View Badges</button>
            </Link>
            <Link to="/employee/leaderboard" style={{ textDecoration: "none", flex: 1 }}>
              <button style={{ width: "100%", padding: "8px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 5, color: C.textSec, fontSize: 11, cursor: "pointer" }}>Leaderboard</button>
            </Link>
          </div>
        </div>

        {/* Interactions */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
          <h3 style={{ fontSize: 10, fontWeight: 600, color: C.textSec, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>My Interactions</h3>
          {[
            { label: "Emails Received",      v: (stats?.interactions?.opened || 0) + (stats?.interactions?.reported || 0), color: C.accent,   icon: null },
            { label: "Phishing Reported",     v: stats?.interactions?.reported || 0,   color: C.success, icon: CheckCircle },
            { label: "Links Clicked",         v: stats?.interactions?.clicked || 0,    color: C.warning, icon: AlertTriangle },
            { label: "Credentials Submitted", v: stats?.interactions?.submitted || 0,  color: C.danger,  icon: ShieldOff },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "8px 10px", background: C.inner, borderRadius: 5, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {item.icon && <item.icon size={12} color={item.color} />}
                <span style={{ fontSize: 12, color: C.textSec }}>{item.label}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.v}</span>
            </div>
          ))}
        </div>
      </div>

      {trendData.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>Score History</h3>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="i" tick={{ fill: C.textSec, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: C.textSec, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} formatter={v => [v, "Score"]} labelFormatter={l => `Event #${l}`} />
              <Line type="monotone" dataKey="score" stroke={C.accent} strokeWidth={2} dot={{ fill: C.accent, r: 3, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>Recent Badges</h3>
          {myBadges?.earned?.length > 0 ? (
            myBadges.earned.slice(0, 4).map(ub => (
              <div key={ub.id} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: C.inner, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {ub.badge?.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{ub.badge?.name}</div>
                  <div style={{ fontSize: 11, color: C.textSec }}>{ub.badge?.description}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: C.textSec, fontSize: 12 }}>No badges yet. Report phishing emails to earn badges.</div>
          )}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14 }}>Security Tips</h3>
          {[
            { title: "Check the sender domain",   tip: "Always verify the full email address — one extra word signals a fake domain." },
            { title: "Urgency is a red flag",      tip: "Real IT never gives 2-hour deadlines. Pressure is a phishing tactic." },
            { title: "Hover before you click",     tip: "Check the real URL in your status bar before clicking any link." },
            { title: "When in doubt, call",         tip: "Verify unexpected requests directly with the sender by phone." },
          ].map((t, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 2 }}>{t.title}</div>
              <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.5 }}>{t.tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
