import { useTheme } from "../context/ThemeContext";

export default function ScoreGauge({ score }) {
  const { C } = useTheme();
  const color = score <= 30 ? C.danger : score <= 70 ? C.warning : C.success;
  const label = score <= 30 ? "HIGH RISK" : score <= 70 ? "MEDIUM RISK" : "LOW RISK";

  const r = 54, cx = 70, cy = 70;
  const startAngle = -210, endAngle = 30;
  const fillAngle = startAngle + ((endAngle - startAngle) * score) / 100;
  const toRad = (d) => (d * Math.PI) / 180;
  const arcPath = (a1, a2) => {
    const x1 = cx + r * Math.cos(toRad(a1)), y1 = cy + r * Math.sin(toRad(a1));
    const x2 = cx + r * Math.cos(toRad(a2)), y2 = cy + r * Math.sin(toRad(a2));
    return `M ${x1} ${y1} A ${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={140} height={100} viewBox="0 0 140 100">
        <path d={arcPath(startAngle, endAngle)} fill="none" stroke={C.border} strokeWidth={8} strokeLinecap="round" />
        <path d={arcPath(startAngle, fillAngle)} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={C.text} fontSize={22} fontWeight="700">{score}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={C.textSec} fontSize={9}>/ 100</text>
      </svg>
      <span style={{
        fontSize: 10, fontWeight: 700, color,
        background: `${color}15`, border: `1px solid ${color}30`,
        padding: "2px 10px", borderRadius: 3, marginTop: -10,
        letterSpacing: "0.06em",
      }}>{label}</span>
    </div>
  );
}
