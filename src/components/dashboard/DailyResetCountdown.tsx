"use client";

import { useEffect, useState } from "react";
import { Clock, Sparkles, CheckCircle2, Flame, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DailyResetCountdownProps {
  nextResetIso?: string;
  isComplete?: boolean;
  dayNumber: number;
  solvedCount: number;
  totalCount: number;
}

export function DailyResetCountdown({
  nextResetIso,
  isComplete,
  dayNumber,
  solvedCount,
  totalCount,
}: DailyResetCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    function calculateTime() {
      const target = nextResetIso
        ? new Date(nextResetIso).getTime()
        : (() => {
            const now = new Date();
            return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)).getTime();
          })();

      const now = Date.now();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: hours.toString().padStart(2, "0"),
        minutes: minutes.toString().padStart(2, "0"),
        seconds: seconds.toString().padStart(2, "0"),
      });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [nextResetIso]);

  return (
    <div
      style={{
        background: isComplete ? "rgba(16, 185, 129, 0.06)" : "var(--bg-surface)",
        border: isComplete ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border-editorial)",
        borderRadius: "4px",
        padding: "1.25rem 1.5rem",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.25rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "4px",
            background: isComplete ? "rgba(16, 185, 129, 0.15)" : "rgba(33, 72, 255, 0.12)",
            color: isComplete ? "var(--accent-acid)" : "var(--accent-cobalt)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isComplete ? <CheckCircle2 size={22} /> : <Clock size={22} />}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                color: isComplete ? "var(--accent-acid)" : "var(--accent-cobalt)",
                fontWeight: 800,
                letterSpacing: "0.05em",
              }}
            >
              {isComplete ? "DAY COMPLETED // MISSION CLEARED" : `DAY ${dayNumber.toString().padStart(2, "0")} IN PROGRESS`}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>• 24-HR UTC ROTATION</span>
          </div>

          <div style={{ fontSize: "0.95rem", color: "#FFF", fontWeight: 600, marginTop: "0.2rem" }}>
            {isComplete ? (
              <span>All {totalCount} daily questions conquered (+20 Bonus Points Claimed) 🎉</span>
            ) : (
              <span>
                {solvedCount} of {totalCount} solved. Complete all {totalCount} to secure streak & unlock +20 bonus points.
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            NEXT DAILY 3 RESETS IN
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.3rem",
              fontWeight: 800,
              color: "#FFF",
              letterSpacing: "0.05em",
            }}
          >
            <span style={{ color: "var(--accent-acid)" }}>{timeLeft.hours}</span>h :{" "}
            <span style={{ color: "var(--accent-acid)" }}>{timeLeft.minutes}</span>m :{" "}
            <span style={{ color: "var(--accent-acid)" }}>{timeLeft.seconds}</span>s
          </div>
        </div>

        {isComplete && (
          <Link
            href="/problems"
            className="btn-editorial-primary"
            style={{ fontSize: "0.8rem", padding: "0.6rem 1rem", textDecoration: "none" }}
          >
            PRACTICE ROADMAP <ArrowRight size={14} style={{ marginLeft: "4px", display: "inline" }} />
          </Link>
        )}
      </div>
    </div>
  );
}
