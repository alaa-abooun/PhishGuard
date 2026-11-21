import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { campaignsAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";

const TOPICS = ["IT Support", "HR Compliance", "Finance", "Executive CEO", "Security Alert", "Benefits Update", "Password Reset", "Software License", "VPN Access", "Cloud Storage"];
const TONES = ["urgent", "formal", "friendly", "casual", "authoritative"];
const URGENCY = ["low", "medium", "high", "critical"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const DEPARTMENTS = ["All", "IT", "Finance", "HR", "Marketing", "Operations", "Sales", "Management"];

export default function CreateCampaign() {
  const { C } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", topic: "IT Support", tone: "urgent", urgency: "high", difficulty: "medium", department_target: "All", description: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const diffColor = (d) => d === "easy" ? C.success : d === "medium" ? C.warning : C.danger;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Campaign title is required"); return; }
    setLoading(true);
    try { const { data } = await campaignsAPI.create(form); toast.success("Campaign created."); navigate(`/admin/campaigns/${data.campaign.id}`); }
    catch (err) { toast.error(err.response?.data?.error || "Failed to create"); }
    finally { setLoading(false); }
  };

  const iStyle = { width: "100%", padding: "9px 12px", background: C.inner, border: `1px solid ${C.borderInput}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Create Campaign</h1>
        <p style={{ color: C.textSec, fontSize: 12, marginTop: 4 }}>Configure the phishing scenario. The AI will generate emails based on these settings.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, marginBottom: 14 }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: C.textSec, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.07em" }}>Basic Information</h3>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: C.textSec, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Campaign Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. IT Password Reset Q1 2026" style={iStyle} onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.borderInput} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: C.textSec, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Optional notes..." style={{ ...iStyle, height: 70, resize: "vertical" }} />
          </div>
        </div>

        {/* Scenario */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, marginBottom: 14 }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: C.textSec, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.07em" }}>Phishing Scenario</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[["Topic", "topic", TOPICS], ["Target Department", "department_target", DEPARTMENTS], ["Email Tone", "tone", TONES], ["Urgency Level", "urgency", URGENCY]].map(([label, key, opts]) => (
              <div key={key}>
                <label style={{ fontSize: 10, color: C.textSec, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label} *</label>
                <select value={form[key]} onChange={e => set(key, e.target.value)} style={iStyle}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, marginBottom: 18 }}>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: C.textSec, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Adaptive Difficulty</h3>
          <p style={{ fontSize: 12, color: C.textSec, marginBottom: 14, lineHeight: 1.6 }}>Controls how convincing the generated email will be.</p>
          <div style={{ display: "flex", gap: 10 }}>
            {DIFFICULTIES.map(d => {
              const active = form.difficulty === d;
              const color = diffColor(d);
              const desc = d === "easy" ? "Obvious red flags" : d === "medium" ? "Subtle clues" : "Highly convincing";
              return (
                <button key={d} type="button" onClick={() => set("difficulty", d)} style={{
                  flex: 1, padding: "14px 10px",
                  border: `1px solid ${active ? color : C.border}`,
                  borderTop: `3px solid ${active ? color : C.border}`,
                  borderRadius: 6,
                  background: active ? `${color}08` : C.inner,
                  color: active ? color : C.textSec,
                  cursor: "pointer", fontWeight: active ? 600 : 400,
                  textTransform: "capitalize", fontSize: 13,
                }}>
                  {d}
                  <div style={{ fontSize: 10, fontWeight: 400, marginTop: 4, color: active ? color : C.textMuted }}>{desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={loading} style={{ padding: "10px 24px", background: loading ? `${C.btnPrimary}70` : C.btnPrimary, border: "none", borderRadius: 6, color: C.btnPrimaryText, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontSize: 13 }}>
            {loading ? "Creating..." : "Create Campaign"}
          </button>
          <button type="button" onClick={() => navigate("/admin/campaigns")} style={{ padding: "10px 18px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textSec, cursor: "pointer", fontSize: 13 }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
