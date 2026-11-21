import { useEffect, useState } from "react";
import { campaignsAPI, reportsAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import { Download, Users, Mail, MousePointer, ShieldOff, Flag } from "lucide-react";

const riskLevel = (s) => s <= 30 ? "high" : s <= 70 ? "medium" : "low";

export default function Reports() {
  const { C } = useTheme();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [report, setReport] = useState(null);
  const [deptFilter, setDeptFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const RISK_COLOR = { high: C.danger, medium: C.warning, low: C.success };
  const selectStyle = { padding: "8px 12px", background: C.inner, border: `1px solid ${C.borderInput}`, borderRadius: 6, color: C.text, fontSize: 12, outline: "none" };

  useEffect(() => {
    campaignsAPI.list().then(r => {
      const all = r.data.campaigns;
      setCampaigns(all);
      if (all.length > 0) setSelectedCampaign(all[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedCampaign) return;
    setLoading(true);
    reportsAPI.campaignReport(selectedCampaign.id, deptFilter || undefined)
      .then(r => setReport(r.data))
      .catch(() => toast.error("Failed to load report"))
      .finally(() => setLoading(false));
  }, [selectedCampaign, deptFilter]);

  const departments = report ? [...new Set(report.rows.map(r => r.department))] : [];

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Campaign Reports</h1>
        <p style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>Per-user results for each phishing simulation campaign</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "flex-end" }}>
        <div>
          <label style={{ fontSize: 10, color: C.textSec, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Campaign</label>
          <select value={selectedCampaign?.id || ""} onChange={e => setSelectedCampaign(campaigns.find(c => c.id === Number(e.target.value)))} style={selectStyle}>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, color: C.textSec, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Department</label>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={selectStyle}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {selectedCampaign && (
          <a href={`/api/reports/campaign/${selectedCampaign.id}/export/csv`} download>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "transparent", border: `1px solid ${C.accent}`, borderRadius: 6, color: C.accent, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              <Download size={13} /> Export CSV
            </button>
          </a>
        )}
      </div>

      {/* Summary Cards */}
      {report && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Assigned",         value: report.summary.total,     icon: Users,        color: C.text },
            { label: "Opened",           value: report.summary.opened,    icon: Mail,         color: C.accent },
            { label: "Clicked",          value: report.summary.clicked,   icon: MousePointer, color: C.warning },
            { label: "Submitted Creds",  value: report.summary.submitted, icon: ShieldOff,    color: C.danger },
            { label: "Reported",         value: report.summary.reported,  icon: Flag,         color: C.success },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `2px solid ${s.color}30`, borderRadius: 8, padding: "14px", textAlign: "center" }}>
              <s.icon size={14} color={s.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.textSec, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ color: C.textSec, textAlign: "center", padding: 40, fontSize: 13 }}>Loading report...</div>
      ) : report ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.inner }}>
                {["Name", "Department", "Delivery", "Opened", "Clicked", "Submitted", "Reported", "Score"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, color: C.textSec, fontWeight: 600, borderBottom: `1px solid ${C.border}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row, i) => {
                const rl = riskLevel(row.vulnerability_score);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: C.text }}>{row.full_name}</td>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: C.textSec }}>{row.department}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: row.delivery_status === "sent" ? `${C.success}12` : "transparent", border: `1px solid ${row.delivery_status === "sent" ? C.success + "40" : C.border}`, color: row.delivery_status === "sent" ? C.success : C.textSec, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {row.delivery_status}
                      </span>
                    </td>
                    <ActionCell v={row.opened} C={C} />
                    <ActionCell v={row.clicked} danger C={C} />
                    <ActionCell v={row.submitted} danger C={C} />
                    <ActionCell v={row.reported} good C={C} />
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: RISK_COLOR[rl] }}>{row.vulnerability_score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ color: C.textSec, textAlign: "center", padding: 60, fontSize: 13 }}>Select a campaign to view its report</div>
      )}
    </div>
  );
}

function ActionCell({ v, danger, good, C }) {
  const color = v ? (good ? C.success : danger ? C.danger : C.textSec) : C.border;
  return (
    <td style={{ padding: "10px 12px", textAlign: "center" }}>
      <span style={{ fontSize: 13, color, fontWeight: 600 }}>{v ? "+" : "—"}</span>
    </td>
  );
}
