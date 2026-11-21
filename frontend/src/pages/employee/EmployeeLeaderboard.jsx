import { useEffect, useState } from "react";
import { gamificationAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const riskLevel = (s) => s <= 30 ? "high" : s <= 70 ? "medium" : "low";

function rankLabel(rank, muted) {
  if (rank === 1) return { text: "#1", color: "#f59e0b" };
  if (rank === 2) return { text: "#2", color: "#94a3b8" };
  if (rank === 3) return { text: "#3", color: "#b45309" };
  return { text: `#${rank}`, color: muted };
}

export default function EmployeeLeaderboard() {
  const { user } = useAuth();
  const { C } = useTheme();
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  const RISK_COLOR = { high: C.danger, medium: C.warning, low: C.success };

  useEffect(() => {
    gamificationAPI.leaderboard(20)
      .then(r => setBoard(r.data.leaderboard))
      .finally(() => setLoading(false));
  }, []);

  const myEntry = board.find(u => u.full_name === user?.full_name);

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Security Leaderboard</h1>
        <p style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>Top security-aware employees ranked by points</p>
      </div>

      {/* My Position */}
      {myEntry && (
        <div style={{
          background: C.card,
          border: `1px solid ${C.accent}30`,
          borderLeft: `3px solid ${C.accent}`,
          borderRadius: 8,
          padding: "14px 18px",
          marginBottom: 18,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 10, color: C.textSec, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Position</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
              {rankLabel(myEntry.rank, C.textSec).text} {myEntry.full_name}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.warning, letterSpacing: "-0.01em" }}>{myEntry.points}</div>
            <div style={{ fontSize: 10, color: C.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>points</div>
          </div>
        </div>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.inner }}>
              {["Rank", "Employee", "Department", "Points", "Score"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, color: C.textSec, fontWeight: 600, borderBottom: `1px solid ${C.border}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: C.textSec, fontSize: 13 }}>Loading...</td></tr>
            ) : board.map(u => {
              const rl = riskLevel(u.vulnerability_score);
              const isMe = u.full_name === user?.full_name;
              const rank = rankLabel(u.rank, C.textSec);
              return (
                <tr key={u.user_id} style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: isMe ? `${C.accent}08` : "transparent",
                }}>
                  <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 700, color: rank.color }}>{rank.text}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 13, fontWeight: isMe ? 700 : 500, color: isMe ? C.accent : C.text }}>
                      {u.full_name}{isMe ? " (You)" : ""}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: C.textSec }}>{u.department}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: C.warning }}>{u.points}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: RISK_COLOR[rl] }}>{u.vulnerability_score}/100</span>
                    <span style={{ fontSize: 9, marginLeft: 6, padding: "1px 6px", borderRadius: 3, border: `1px solid ${RISK_COLOR[rl]}30`, background: `${RISK_COLOR[rl]}10`, color: RISK_COLOR[rl], textTransform: "uppercase", letterSpacing: "0.04em" }}>{rl}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
