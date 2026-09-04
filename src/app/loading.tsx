export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#081C15",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
      }}
    >
      <div
        style={{
          fontFamily: "'Arial Black', sans-serif",
          fontSize: "clamp(2rem, 6vw, 4rem)",
          fontWeight: 900,
          color: "#52B788",
          letterSpacing: "0.06em",
          marginBottom: "1rem",
        }}
      >
        MAB
      </div>
      <div
        style={{
          width: "48px",
          height: "2px",
          backgroundColor: "#1B4332",
          position: "relative",
          overflow: "hidden",
          borderRadius: "2px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "50%",
            height: "100%",
            backgroundColor: "#52B788",
            animation: "loadingBar 1.2s infinite ease-in-out",
          }}
        />
      </div>
      <style>{`
        @keyframes loadingBar {
          0% { left: -50%; width: 30%; }
          50% { left: 25%; width: 70%; }
          100% { left: 100%; width: 30%; }
        }
      `}</style>
    </div>
  );
}
