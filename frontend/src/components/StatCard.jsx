import { useTheme } from "../context/ThemeContext";

export default function StatCard({ label, value, icon: Icon, color, sub }) {
  const { C } = useTheme();
  const accentColor = color || C.accent;

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderTop: `2px solid ${accentColor}`,
      borderRadius: 8,
      padding: "18px 20px",
    }}>
      {Icon && <Icon size={15} color={accentColor} style={{ marginBottom: 12 }} />}
      <div style={{ fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textSec, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: accentColor, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
