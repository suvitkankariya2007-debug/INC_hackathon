export default function RiskMeter({ score, label }) {
  const colorMap = {
    low:      { bar: "#22c55e", text: "#15803d", bg: "#f0fdf4" },
    medium:   { bar: "#f59e0b", text: "#b45309", bg: "#fffbeb" },
    high:     { bar: "#f97316", text: "#c2410c", bg: "#fff7ed" },
    critical: { bar: "#ef4444", text: "#b91c1c", bg: "#fef2f2" },
  };

  const colors = colorMap[label] || colorMap["low"];
  const pct = Math.min(score, 100);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
          Risk score
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: 99,
          background: colors.bg,
          color: colors.text,
          textTransform: "capitalize",
          border: `0.5px solid ${colors.bar}44`,
        }}>
          {label} · {score}
        </span>
      </div>
      <div style={{
        height: 5,
        borderRadius: 99,
        background: "#e5e7eb",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 99,
          background: colors.bar,
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}
