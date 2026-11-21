import { useEffect, useState } from "react";
import { gamificationAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { Award } from "lucide-react";

const riskLevel = (s) => s <= 30 ? "high" : s <= 70 ? "medium" : "low";

function rankLabel(rank, muted) {
  if (rank === 1) return { text: "#1", color: "#f59e0b" };
  if (rank === 2) return { text: "#2", color: "#94a3b8" };
  if (rank === 3) return { text: "#3", color: "#b45309" };
  return { text: `#${rank}`, color: muted };
}

export default function Leaderboard() {
  const { C } = useTheme();
  const [board, setBoard] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const RISK_COLOR = { high: C.danger, medium: C.warning, low: C.success };

  useEffect(() => {
    Promise.all([gamificationAPI.leaderboard(20), gamificationAPI.allBadges()])
      .then(([lb, bd]) => { setBoard(lb.data.leaderboard); setBadges(bd.data.badges); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Security Leaderboard</h1>
        <p style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>Top employees by security awareness points</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Leaderboard Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          {/* Top 3 Podium */}
          {board.length >= 3 && (
            <div style={{ background: C.inner, padding: "20px 16px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12 }}>
                {[board[1], board[0], board[2]].map((u, i) => {
                  const heights = [70, 90, 60];
                  const ranks = [2, 1, 3];
                  const rl = rankLabel(ranks[i], C.textSec);
                  return (
                    <div key={u.user_id} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: rl.color, marginBottom: 6 }}>{rl.text}</div>
                      <div style={{
                        width: 56, height: heights[i],
                        background: `${rl.color}12`,
                        border: `1px solid ${rl.color}30`,
                        borderRadius: "4px 4px 0 0",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "flex-end",
                        paddingBottom: 8,
                      }}>
                        <div style={{ fontSize: 9, color: rl.color, fontWeight: 700, letterSpacing: "0.04em" }}>PTS</div>
                        <div style={{ fontSize: 12, color: rl.color, fontWeight: 800 }}>{u.points}</div>
                      </div>
                      <div style={{ fontSize: 10, color: C.textSec, marginTop: 5, maxWidth: 60 }}>{u.full_name.split(" ")[0]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.inner }}>
                {["#", "Employee", "Department", "Points", "Score", "Badges"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, color: C.textSec, fontWeight: 600, borderBottom: `1px solid ${C.border}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: C.textSec, fontSize: 13 }}>Loading...</td></tr>
              ) : board.map(u => {
                const rl = riskLevel(u.vulnerability_score);
                const rank = rankLabel(u.rank, C.textSec);
                return (
                  <tr key={u.user_id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: rank.color }}>{rank.text}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: C.text, fontWeight: 500 }}>{u.full_name}</td>
                    <td style={{ padding: "12px 14px", fontSize: 11, color: C.textSec }}>{u.department}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: C.warning }}>{u.points}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: RISK_COLOR[rl] }}>{u.vulnerability_score}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: C.textSec }}>{u.badge_count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Badge Catalog */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>Badge Catalog</h3>
          {badges.map(b => (
            <div key={b.id} style={{ display: "flex", gap: 10, marginBottom: 12, padding: "10px 12px", background: C.inner, borderRadius: 6, border: `1px solid ${C.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: `${C.accent}15`, border: `1px solid ${C.accent}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Award size={15} color={C.accent} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{b.name}</div>
                <div style={{ fontSize: 10, color: C.textSec, marginTop: 2, lineHeight: 1.4 }}>{b.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
