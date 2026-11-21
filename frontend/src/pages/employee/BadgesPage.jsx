import { useEffect, useState } from "react";
import { gamificationAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Award, Lock, Flag, Zap, TrendingUp } from "lucide-react";

export default function BadgesPage() {
  const { user } = useAuth();
  const { C } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationAPI.myBadges()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: C.textSec, padding: 40, fontSize: 13 }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Badges & Points</h1>
        <p style={{ color: C.textSec, fontSize: 12, marginTop: 2 }}>Earn badges by identifying phishing simulations correctly</p>
      </div>

      {/* Points Summary */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderTop: `2px solid ${C.accent}`,
        borderRadius: 8,
        padding: "22px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 11, color: C.textSec, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Total Points</div>
          <div style={{ fontSize: 38, fontWeight: 800, color: C.warning, letterSpacing: "-0.02em" }}>{user?.points || 0}</div>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>Rank #{data?.points_rank || "—"} in your organization</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: C.textSec, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Badges Earned</div>
          <div style={{ fontSize: 38, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>{data?.earned?.length || 0}</div>
        </div>
      </div>

      {/* How to earn points */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18, marginBottom: 20 }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: C.textSec, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>How to Earn Points</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { action: "Report Phishing",           pts: "+50",       color: C.success, icon: Flag },
            { action: "Fast Report (under 5 min)", pts: "+25 bonus", color: C.success, icon: Zap },
            { action: "Streak Bonus (3+)",         pts: "Extra",     color: C.accent,  icon: TrendingUp },
          ].map(item => (
            <div key={item.action} style={{ background: C.inner, border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 14px", textAlign: "center" }}>
              <item.icon size={16} color={item.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: item.color, letterSpacing: "-0.01em" }}>{item.pts}</div>
              <div style={{ fontSize: 10, color: C.textSec, marginTop: 4, lineHeight: 1.4 }}>{item.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Earned Badges */}
      <h3 style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Earned ({data?.earned?.length || 0})
      </h3>
      {data?.earned?.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, textAlign: "center", marginBottom: 20 }}>
          <Award size={28} color={C.textSec} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13, color: C.textSec }}>No badges earned yet. Start identifying phishing simulations.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 24 }}>
          {data?.earned?.map(ub => (
            <BadgeCard key={ub.id} badge={ub.badge} earned awardedAt={ub.awarded_at} />
          ))}
        </div>
      )}

      {/* Locked Badges */}
      <h3 style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Locked ({data?.unearned?.length || 0})
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
        {data?.unearned?.map(b => (
          <BadgeCard key={b.id} badge={b} earned={false} />
        ))}
      </div>
    </div>
  );
}

function BadgeCard({ badge, earned, awardedAt }) {
  const { C } = useTheme();
  return (
    <div style={{
      background: earned ? C.card : C.inner,
      border: `1px solid ${earned ? C.accent + "30" : C.border}`,
      borderTop: earned ? `2px solid ${C.accent}40` : "2px solid transparent",
      borderRadius: 8, padding: "18px 14px", textAlign: "center",
      opacity: earned ? 1 : 0.55,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8, margin: "0 auto 10px",
        background: earned ? `${C.accent}15` : C.inner,
        border: `1px solid ${earned ? C.accent + "30" : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {earned
          ? <Award size={18} color={C.accent} />
          : <Lock size={14} color={C.textSec} />
        }
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: earned ? C.text : C.textSec }}>
        {badge?.name}
      </div>
      <div style={{ fontSize: 10, color: C.textSec, marginTop: 4, lineHeight: 1.5 }}>
        {badge?.description}
      </div>
      {earned && awardedAt && (
        <div style={{ fontSize: 10, color: C.accent, marginTop: 8 }}>
          Earned {new Date(awardedAt).toLocaleDateString()}
        </div>
      )}
      {!earned && (
        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8 }}>{badge?.condition}</div>
      )}
    </div>
  );
}
