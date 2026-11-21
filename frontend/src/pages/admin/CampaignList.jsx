import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { campaignsAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import { Plus, Play, Pause, Eye, Trash2 } from "lucide-react";

const STATUS = {
  draft:            { color: "#a5a29d", label: "Draft" },
  pending_approval: { color: "#d97706", label: "Pending" },
  active:           { color: "#16a34a", label: "Active" },
  completed:        { color: "#2563eb", label: "Completed" },
  paused:           { color: "#f97316", label: "Paused" },
};

export default function CampaignList() {
  const { C } = useTheme();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    campaignsAPI.list(filter || undefined).then(r => setCampaigns(r.data.campaigns)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const handleActivate = async (id) => { try { await campaignsAPI.activate(id); toast.success("Campaign activated."); load(); } catch (e) { toast.error(e.response?.data?.error || "Failed"); } };
  const handlePause = async (id) => { await campaignsAPI.pause(id); toast.success("Paused"); load(); };
  const handleDelete = async (id) => { if (!window.confirm("Delete?")) return; try { await campaignsAPI.delete(id); toast.success("Deleted"); load(); } catch (e) { toast.error(e.response?.data?.error || "Cannot delete"); } };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Campaigns</h1>
          <p style={{ color: C.textSec, fontSize: 12, marginTop: 4 }}>Manage phishing simulation campaigns</p>
        </div>
        <Link to="/admin/campaigns/new">
          <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", background: C.btnPrimary, border: "none", borderRadius: 6, color: C.btnPrimaryText, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            <Plus size={14} /> New Campaign
          </button>
        </Link>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {["", "draft", "active", "completed", "paused"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "5px 12px", borderRadius: 4,
            border: `1px solid ${filter === s ? C.accent : C.border}`,
            background: filter === s ? C.accentDim : "transparent",
            color: filter === s ? C.accent : C.textSec,
            fontSize: 11, cursor: "pointer", textTransform: "capitalize",
          }}>
            {s ? STATUS[s]?.label ?? s : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: C.textSec, padding: "40px 0", textAlign: "center", fontSize: 13 }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.textSec }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>No campaigns yet</div>
          <div style={{ fontSize: 12 }}>Create your first phishing simulation campaign</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {campaigns.map(c => {
            const s = STATUS[c.status] || STATUS.draft;
            return (
              <div key={c.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.title}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3, border: `1px solid ${s.color}30`, background: `${s.color}10`, color: s.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec }}>{c.topic} · {c.tone} · {c.difficulty} · {c.department_target}{c.assignment_count > 0 ? ` · ${c.assignment_count} assigned` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <Btn onClick={() => navigate(`/admin/campaigns/${c.id}`)} color={C.textSec} C={C}><Eye size={14} /></Btn>
                  {(c.status === "draft" || c.status === "pending_approval") ? <Btn onClick={() => handleActivate(c.id)} color={C.success} C={C}><Play size={14} /></Btn>
                    : c.status === "active" ? <Btn onClick={() => handlePause(c.id)} color={C.warning} C={C}><Pause size={14} /></Btn> : null}
                  {c.status !== "active" && <Btn onClick={() => handleDelete(c.id)} color={C.danger} C={C}><Trash2 size={14} /></Btn>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Btn({ onClick, color, C, children }) {
  return (
    <button onClick={onClick} style={{ padding: "6px 8px", background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 5, color, cursor: "pointer", display: "flex", alignItems: "center" }}>
      {children}
    </button>
  );
}
