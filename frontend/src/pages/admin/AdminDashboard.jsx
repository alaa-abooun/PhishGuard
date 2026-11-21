import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { analyticsAPI } from "../../services/api";
import StatCard from "../../components/StatCard";
import { useTheme } from "../../context/ThemeContext";
import { Users, Mail, BarChart3, Flag, MousePointer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard() {
  const { C } = useTheme();
  const [data, setData] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsAPI.overview(), analyticsAPI.riskHeatmap(), analyticsAPI.topAtRisk(8)])
      .then(([ov, hm, risk]) => { setData(ov.data); setHeatmap(hm.data.heatmap); setAtRisk(risk.data.users); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: C.textSec, fontSize: 13, padding: 40 }}>Loading...</div>;
  if (!data) return <div style={{ color: C.danger, fontSize: 13 }}>Failed to load dashboard.</div>;

  const RISK = { high: C.danger, medium: C.warning, low: C.success };
  const interactionData = [
    { name: "Opened",    value: data.interactions.opened,    color: C.accent },
    { name: "Clicked",   value: data.interactions.clicked,   color: C.warning },
    { name: "Submitted", value: data.interactions.submitted, color: C.danger },
    { name: "Reported",  value: data.interactions.reported,  color: C.success },
  ];
  const riskPie = [
    { name: "High Risk",   value: data.risk_distribution.high },
    { name: "Medium Risk", value: data.risk_distribution.medium },
    { name: "Low Risk",    value: data.risk_distribution.low },
  ];
  const TT = { background: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, color: C.text, fontSize: 11, borderRadius: 6 };
  const AX = { fill: C.textSec, fontSize: 11 };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Security Dashboard</h1>
        <p style={{ color: C.textSec, fontSize: 12, marginTop: 4 }}>Campaign performance and employee risk overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 22 }}>
        <StatCard label="Total Employees"   value={data.total_users}                        icon={Users}        color={C.accent} />
        <StatCard label="Active Campaigns"  value={data.active_campaigns}                   icon={Mail}         color={C.warning} />
        <StatCard label="Avg Vulnerability" value={`${data.avg_vulnerability_score}/100`}   icon={BarChart3}    color={C.danger} />
        <StatCard label="Report Rate"       value={`${data.report_rate}%`}                  icon={Flag}         color={C.success} sub="of sent simulations" />
        <StatCard label="Click Rate"        value={`${data.click_rate}%`}                   icon={MousePointer} color={C.warning} sub="of opened emails" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <ChartCard title="Interaction Overview" sub="All campaigns combined" C={C}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={interactionData} margin={{ top: 10 }}>
              <XAxis dataKey="name" tick={AX} axisLine={false} tickLine={false} />
              <YAxis tick={AX} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} cursor={{ fill: "rgba(128,128,128,0.06)" }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {interactionData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk Distribution" sub="Current employee risk levels" C={C}>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={riskPie} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {riskPie.map((_, i) => <Cell key={i} fill={Object.values(RISK)[i]} />)}
              </Pie>
              <Tooltip contentStyle={TT} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <ChartCard title="Department Risk Heatmap" sub="Avg vulnerability score by department" C={C}>
          {heatmap.map(dept => (
            <div key={dept.department} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: C.text }}>{dept.department}</span>
                <span style={{ fontSize: 11, color: RISK[dept.risk_level], fontWeight: 600 }}>{dept.avg_score}/100 — {dept.user_count} users</span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${dept.avg_score}%`, background: RISK[dept.risk_level], borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </ChartCard>

        <ChartCard title="Top At-Risk Users" sub="Highest vulnerability scores" C={C}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Name", "Dept", "Score", "Risk"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 10, color: C.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atRisk.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.inner}` }}>
                  <td style={{ padding: "8px", fontSize: 12, color: C.text }}>{u.full_name}</td>
                  <td style={{ padding: "8px", fontSize: 11, color: C.textSec }}>{u.department}</td>
                  <td style={{ padding: "8px", fontSize: 13, fontWeight: 700, color: RISK[u.risk_level] }}>{u.vulnerability_score}</td>
                  <td style={{ padding: "8px" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: `${RISK[u.risk_level]}15`, border: `1px solid ${RISK[u.risk_level]}30`, color: RISK[u.risk_level], textTransform: "uppercase", letterSpacing: "0.05em" }}>{u.risk_level}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Link to="/admin/campaigns/new" style={{ textDecoration: "none" }}>
          <button style={{ padding: "9px 18px", background: C.btnPrimary, border: "none", borderRadius: 6, color: C.btnPrimaryText, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            + New Campaign
          </button>
        </Link>
        <Link to="/admin/analytics" style={{ textDecoration: "none" }}>
          <button style={{ padding: "9px 18px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textSec, fontSize: 12, cursor: "pointer" }}>
            View Analytics
          </button>
        </Link>
      </div>
    </div>
  );
}

function ChartCard({ title, sub, children, C }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}
