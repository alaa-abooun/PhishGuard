import { useEffect, useState } from "react";
import { usersAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import { UserPlus, X } from "lucide-react";

const riskLevel = (s) => s <= 30 ? "high" : s <= 70 ? "medium" : "low";

export default function UsersManagement() {
  const { C } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "Employee@1234", role: "employee", department: "IT" });

  const RISK_COLOR = { high: C.danger, medium: C.warning, low: C.success };
  const iStyle = { width: "100%", padding: "9px 12px", background: C.inner, border: `1px solid ${C.borderInput}`, borderRadius: 6, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

  const load = () => {
    usersAPI.list({ role: "employee" })
      .then(r => setUsers(r.data.users))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.create(form);
      toast.success("User created");
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || "Failed to create user"); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this user?")) return;
    await usersAPI.deactivate(id);
    toast.success("User deactivated");
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Users</h1>
          <p style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>{users.length} employees registered</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "9px 16px", background: C.btnPrimary,
          border: "none", borderRadius: 6, color: C.btnPrimaryText, fontWeight: 600, fontSize: 12, cursor: "pointer",
        }}>
          <UserPlus size={14} /> Add User
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, email, or department..."
        style={{ ...iStyle, maxWidth: 380, marginBottom: 16 }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.borderInput}
      />

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.inner }}>
              {["Name", "Email", "Department", "Score", "Risk", "Points", "Status", ""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, color: C.textSec, fontWeight: 600, borderBottom: `1px solid ${C.border}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: C.textSec, fontSize: 13 }}>Loading...</td></tr>
            ) : filtered.map(u => {
              const rl = riskLevel(u.vulnerability_score);
              return (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = C.inner}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: C.text, fontWeight: 500 }}>{u.full_name}</td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: C.textSec }}>{u.email}</td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: C.textSec }}>{u.department}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: RISK_COLOR[rl] }}>{u.vulnerability_score}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: `${RISK_COLOR[rl]}12`, border: `1px solid ${RISK_COLOR[rl]}30`, color: RISK_COLOR[rl], textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {rl}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: C.warning, fontWeight: 600 }}>{u.points}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, border: `1px solid ${u.is_active ? C.success + "40" : C.border}`, background: u.is_active ? `${C.success}10` : "transparent", color: u.is_active ? C.success : C.textSec, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <button onClick={() => handleDeactivate(u.id)} style={{
                      padding: "4px 10px", background: "transparent",
                      border: `1px solid ${C.danger}40`, borderRadius: 4,
                      color: C.danger, fontSize: 11, cursor: "pointer",
                    }}>Deactivate</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, width: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Add New User</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: C.textSec, cursor: "pointer" }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              {[["Full Name", "full_name", "text"], ["Email", "email", "email"], ["Password", "password", "password"], ["Department", "department", "text"]].map(([label, key, type]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: C.textSec, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required style={iStyle} />
                </div>
              ))}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, color: C.textSec, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={iStyle}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" style={{ flex: 1, padding: "9px", background: C.btnPrimary, border: "none", borderRadius: 6, color: C.btnPrimaryText, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Create</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "9px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textSec, cursor: "pointer", fontSize: 13 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
