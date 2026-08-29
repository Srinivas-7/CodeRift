export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 120px)",
        width: "100%",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            width: "36px",
            height: "36px",
            border: "3px solid rgba(33, 72, 255, 0.2)",
            borderTopColor: "var(--accent-cobalt)",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            marginBottom: "1rem",
          }}
        />
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
          }}
        >
          Loading Arena Data...
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
