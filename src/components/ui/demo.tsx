import { ShaderAnimation } from "@/components/ui/shader-animation";

export default function DemoOne() {
  return (
    <div
      className="relative flex h-[650px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border bg-blue-700"
      style={{
        position: "relative",
        display: "flex",
        height: "650px",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        background: "#1d4ed8",
      }}
    >
      <ShaderAnimation />
      <span
        className="absolute pointer-events-none z-10 text-center text-7xl leading-none font-semibold tracking-tighter whitespace-pre-wrap text-white"
        style={{
          position: "absolute",
          pointerEvents: "none",
          zIndex: 10,
          textAlign: "center",
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          lineHeight: 1,
          fontWeight: 700,
          letterSpacing: "-0.05em",
          whiteSpace: "pre-wrap",
          color: "#FFFFFF",
        }}
      >
        Shader Animation
      </span>
    </div>
  );
}
