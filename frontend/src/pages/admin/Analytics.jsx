import { useEffect, useState } from "react";
import { analyticsAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { BarChart3, MousePointer, Flag, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid
} from "recharts";

export default function Analytics() {
  const { C } = useTheme();
  const [overview, setOverview] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsAPI.overview(), analyticsAPI.riskHeatmap(), analyticsAPI.scoreTrend({})])
      .then(([ov, hm, tr]) => {
        setOverview(ov.data);
        setHeatmap(hm.data.heatmap);
        setTrend(tr.data.trend.map((t, i) => ({ i: i + 1, score: t.new_score, action: t.reason })));
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: C.textSec, padding: 40, fontSize: 13 }}>Loading analytics...</div>;
  if (!overview) return <div style={{ color: C.danger, fontSize: 13 }}>Failed to load analytics</div>;

  const RISK_COLORS = { high: C.danger, medium: C.warning, low: C.success };
  const tooltipStyle = { background: C.tooltipBg, border: `1px solid ${C.tooltipBorder}`, color: C.text, fontSize: 11, borderRadius: 6 };
  const axisStyle = { fill: C.textSec, fontSize: 11 };

  const interBar = [
    { name: "Opened",    value: overview.interactions.opened,    fill: C.accent },
    { name: "Clicked",   value: overview.interactions.clicked,   fill: C.warning },
    { name: "Submitted", value: overview.interactions.submitted, fill: C.danger },
    { name: "Reported",  value: overview.interactions.reported,  fill: C.success },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Risk Analytics</h1>
        <p style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>Organization-wide phishing simulation performance</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Avg Vulnerability Score", value: `${overview.avg_vulnerability_score}/100`, color: C.danger,  icon: BarChart3 },
          { label: "Click Rate",              value: `${overview.click_rate}%`,                 color: C.warning, icon: MousePointer },
          { label: "Report Rate",             value: `${overview.report_rate}%`,                color: C.success, icon: Flag },
          { label: "High-Risk Users",         value: overview.risk_distribution.high,           color: C.danger,  icon: AlertTriangle },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `2px solid ${kpi.color}`, borderRadius: 8, padding: "16px 18px" }}>
            <kpi.icon size={14} color={kpi.color} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color, letterSpacing: "-0.02em" }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: C.textSec, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ChartBox title="Interaction Breakdown" sub="Total across all campaigns">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={interBar}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(128,128,128,0.05)" }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {interBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>

        <ChartBox title="Vulnerability Score Trend" sub="Score changes over events">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="i" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke={C.accent} strokeWidth={2} dot={{ fill: C.accent, r: 3, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      <ChartBox title="Department Risk Heatmap" sub="Average vulnerability score per department">
        <div style={{ marginTop: 8 }}>
          {heatmap.map(d => (
            <div key={d.department} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 110, fontSize: 12, color: C.text }}>{d.department}</div>
              <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${d.avg_score}%`, background: RISK_COLORS[d.risk_level], borderRadius: 3 }} />
              </div>
              <div style={{ width: 100, textAlign: "right", fontSize: 11, fontWeight: 600, color: RISK_COLORS[d.risk_level] }}>
                {d.avg_score}/100 ({d.user_count})
              </div>
            </div>
          ))}
        </div>
      </ChartBox>

      <ChartBox title="Risk Score Distribution" sub="Breakdown of employee risk levels">
        <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
          {[
            { label: "High Risk",   range: "0–30",   count: overview.risk_distribution.high,   color: C.danger,  desc: "Needs immediate attention" },
            { label: "Medium Risk", range: "31–70",  count: overview.risk_distribution.medium, color: C.warning, desc: "Ongoing training recommended" },
            { label: "Low Risk",    range: "71–100", count: overview.risk_distribution.low,    color: C.success, desc: "Good security awareness" },
          ].map(item => (
            <div key={item.label} style={{ flex: 1, background: `${item.color}08`, border: `1px solid ${item.color}25`, borderRadius: 6, padding: "16px 18px" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: item.color, letterSpacing: "-0.02em" }}>{item.count}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: item.color, marginTop: 4 }}>{item.label} ({item.range})</div>
              <div style={{ fontSize: 11, color: C.textSec, marginTop: 4 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </ChartBox>
    </div>
  );
}

function ChartBox({ title, sub, children }) {
  const { C } = useTheme();
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{sub}</div>
      </div>
      {children}
    </div>
  );
}
