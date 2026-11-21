import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { campaignsAPI, aiAPI, usersAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import { Wand2, CheckCircle, Users, Play, ArrowLeft, Check, Minus } from "lucide-react";

export default function CampaignDetail() {
  const { C } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [users, setUsers] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const load = async () => {
    try {
      const [c, u] = await Promise.all([campaignsAPI.get(id), usersAPI.list({ role: "employee" })]);
      setCampaign(c.data.campaign);
      setUsers(u.data.users);
      if (c.data.campaign.emails?.length > 0) setSelectedEmail(c.data.campaign.emails[0]);
    } catch { toast.error("Failed to load campaign"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await aiAPI.generate(id, 3);
      toast.success(`Generated ${data.emails.length} email variations`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "AI generation failed");
    } finally { setGenerating(false); }
  };

  const handleApprove = async (emailId) => {
    try { await campaignsAPI.approveEmail(id, emailId); toast.success("Email approved"); load(); }
    catch { toast.error("Failed to approve"); }
  };

  const handleAssignAll = async () => {
    const dept = campaign.department_target;
    try {
      if (dept === "All") await campaignsAPI.assignUsers(id, { user_ids: users.map(u => u.id) });
      else await campaignsAPI.assignUsers(id, { department: dept });
      toast.success("Users assigned");
      load();
    } catch (e) { toast.error(e.response?.data?.error || "Failed to assign"); }
  };

  const handleActivate = async () => {
    try { const { data } = await campaignsAPI.activate(id); toast.success(data.message); load(); }
    catch (e) { toast.error(e.response?.data?.error || "Activation failed"); }
  };

  if (loading) return <div style={{ color: C.textSec, padding: 40, fontSize: 13 }}>Loading...</div>;
  if (!campaign) return <div style={{ color: C.danger, fontSize: 13 }}>Campaign not found</div>;

  const emails = campaign.emails || [];
  const approvedEmail = emails.find(e => e.approved);
  const canActivate = approvedEmail && campaign.assignment_count > 0;

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={() => navigate("/admin/campaigns")} style={{ background: "none", border: "none", color: C.textSec, cursor: "pointer", padding: 4 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{campaign.title}</h1>
          <p style={{ color: C.textSec, fontSize: 11, marginTop: 2 }}>{campaign.topic} · {campaign.difficulty} difficulty · {campaign.department_target}</p>
        </div>
        {(campaign.status === "draft" || campaign.status === "pending_approval") && (
          <button onClick={handleActivate} disabled={!canActivate} style={{
            padding: "8px 16px", background: canActivate ? C.success : C.textSec,
            border: "none", borderRadius: 6, color: "#fff", fontWeight: 600, fontSize: 12,
            cursor: canActivate ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", gap: 6,
            opacity: canActivate ? 1 : 0.5,
          }}>
            <Play size={13} /> Activate
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <Steps emails={emails} approvedEmail={approvedEmail} assignCount={campaign.assignment_count} status={campaign.status} />

      {/* Step 1: Generate */}
      <Section title="Step 1 — AI Email Generation">
        {emails.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <p style={{ color: C.textSec, marginBottom: 14, fontSize: 12 }}>
              No emails generated yet. Let the AI create phishing simulation emails.
            </p>
            <button onClick={handleGenerate} disabled={generating} style={{
              padding: "10px 24px", background: generating ? `${C.accent}70` : C.accent,
              border: "none", borderRadius: 6, color: "#fff", fontWeight: 600,
              cursor: generating ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8, margin: "0 auto", fontSize: 13,
            }}>
              <Wand2 size={14} /> {generating ? "Generating..." : "Generate 3 Email Variations"}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: C.textSec }}>{emails.length} variation(s) generated</span>
              <button onClick={handleGenerate} disabled={generating} style={{
                padding: "6px 12px", background: "transparent", border: `1px solid ${C.border}`,
                borderRadius: 5, color: C.textSec, fontSize: 11, cursor: "pointer",
              }}>
                {generating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {emails.map((e, i) => (
                <button key={e.id} onClick={() => setSelectedEmail(e)} style={{
                  padding: "6px 14px", borderRadius: 5,
                  border: `1px solid ${selectedEmail?.id === e.id ? C.accent : C.border}`,
                  background: selectedEmail?.id === e.id ? `${C.accent}15` : "transparent",
                  color: selectedEmail?.id === e.id ? C.accent : C.textSec,
                  fontSize: 11, cursor: "pointer",
                }}>
                  Variation {i + 1}{e.approved ? " — Approved" : ""}
                </button>
              ))}
            </div>
            {selectedEmail && <EmailPreview email={selectedEmail} onApprove={() => handleApprove(selectedEmail.id)} />}
          </div>
        )}
      </Section>

      {/* Step 2: Assign */}
      <Section title="Step 2 — Assign Target Users">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: C.textSec, fontSize: 12 }}>
            {campaign.assignment_count > 0
              ? `${campaign.assignment_count} employees assigned.`
              : `No users assigned yet. Target: ${campaign.department_target === "All" ? "all employees" : `${campaign.department_target} department`}.`}
          </p>
          <button onClick={handleAssignAll} style={{
            padding: "8px 16px", background: "transparent",
            border: `1px solid ${C.accent}`, borderRadius: 6,
            color: C.accent, fontWeight: 600, fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Users size={13} /> {campaign.assignment_count > 0 ? "Reassign" : "Assign Users"}
          </button>
        </div>
      </Section>

      {/* Checklist */}
      {campaign.status !== "active" && campaign.status !== "completed" && (
        <div style={{ background: C.inner, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginTop: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: C.textSec, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Launch Checklist</p>
          <CheckItem done={emails.length > 0} label="Generate AI email variations" />
          <CheckItem done={!!approvedEmail} label="Approve one email variation" />
          <CheckItem done={campaign.assignment_count > 0} label="Assign target users" />
          <CheckItem done={canActivate} label="Ready to activate" />
        </div>
      )}
    </div>
  );
}

function Steps({ emails, approvedEmail, assignCount, status }) {
  const { C } = useTheme();
  const steps = [
    { label: "Draft",       done: true },
    { label: "Generated",   done: emails.length > 0 },
    { label: "Approved",    done: !!approvedEmail },
    { label: "Assigned",    done: assignCount > 0 },
    { label: "Active",      done: status === "active" || status === "completed" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 22, background: C.card, borderRadius: 8, padding: "12px 18px", border: `1px solid ${C.border}` }}>
      {steps.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: s.done ? C.accent : C.inner,
              border: `1px solid ${s.done ? C.accent : C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 700,
            }}>
              {s.done ? <Check size={12} /> : <span style={{ fontSize: 10, color: C.textSec }}>{i + 1}</span>}
            </div>
            <span style={{ fontSize: 10, color: s.done ? C.accent : C.textSec, whiteSpace: "nowrap" }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div style={{ width: 36, height: 1, background: C.border, margin: "0 6px 14px" }} />}
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  const { C } = useTheme();
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, marginBottom: 14 }}>
      <h3 style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
      {children}
    </div>
  );
}

function EmailPreview({ email, onApprove }) {
  const { C } = useTheme();
  const [showHtml, setShowHtml] = useState(false);
  let redFlags = [];
  try { redFlags = JSON.parse(email.red_flags || "[]"); } catch {}

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ background: C.inner, padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{email.subject}</div>
            <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>From: {email.sender_name} &lt;{email.sender_email}&gt;</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowHtml(!showHtml)} style={{
              padding: "4px 10px", background: "transparent", border: `1px solid ${C.border}`,
              borderRadius: 4, color: C.textSec, fontSize: 11, cursor: "pointer",
            }}>
              {showHtml ? "Preview" : "HTML"}
            </button>
            {!email.approved && (
              <button onClick={onApprove} style={{
                padding: "4px 12px", background: `${C.success}15`,
                border: `1px solid ${C.success}40`,
                borderRadius: 4, color: C.success, fontWeight: 600, fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <CheckCircle size={11} /> Approve
              </button>
            )}
            {email.approved && (
              <span style={{ fontSize: 11, color: C.success, background: `${C.success}15`, border: `1px solid ${C.success}30`, padding: "4px 10px", borderRadius: 4 }}>Approved</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {showHtml
          ? <pre style={{ fontSize: 11, color: C.textSec, overflowX: "auto", whiteSpace: "pre-wrap" }}>{email.body}</pre>
          : <div dangerouslySetInnerHTML={{ __html: email.body.replace("[TRACKING_LINK]", "#").replace("[TRACKING_PIXEL]", "") }} style={{ fontSize: 13 }} />
        }
      </div>
      {redFlags.length > 0 && (
        <div style={{ background: `${C.danger}08`, borderTop: `1px solid ${C.border}`, padding: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.danger, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Red Flags — Training Content</p>
          {redFlags.map((f, i) => (
            <div key={i} style={{ fontSize: 11, color: C.danger, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${C.danger}40`, opacity: 0.85 }}>{f}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckItem({ done, label }) {
  const { C } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <div style={{ width: 16, height: 16, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: done ? `${C.success}20` : C.inner, border: `1px solid ${done ? C.success : C.border}`, flexShrink: 0 }}>
        {done ? <Check size={10} color={C.success} /> : <Minus size={10} color={C.textSec} />}
      </div>
      <span style={{ fontSize: 12, color: done ? C.text : C.textSec }}>{label}</span>
    </div>
  );
}
