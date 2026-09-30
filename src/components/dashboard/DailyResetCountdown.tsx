"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, ArrowRight } from "lucide-react";
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
        background: isComplete ? "rgba(0, 245, 155, 0.12)" : "var(--bg-surface)",
        border: isComplete ? "3px solid var(--accent-acid)" : "3px solid var(--border-neo-strong)",
        borderRadius: "8px",
        padding: "1.25rem 1.5rem",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.25rem",
        boxShadow: "5px 5px 0px var(--shadow-neo)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "6px",
            background: isComplete ? "var(--accent-acid)" : "var(--accent-yellow)",
            color: "#000000",
            border: "2.5px solid #000000",
            boxShadow: "2px 2px 0px #000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isComplete ? <CheckCircle2 size={24} /> : <Clock size={24} />}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                color: isComplete ? "var(--accent-acid)" : "var(--accent-purple)",
                fontWeight: 900,
                letterSpacing: "0.08em",
              }}
            >
              {isComplete ? "DAY COMPLETED // MISSION CLEARED" : `DAY ${dayNumber.toString().padStart(2, "0")} IN PROGRESS`}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>• 24-HR UTC ROTATION</span>
          </div>

          <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 800, marginTop: "0.2rem" }}>
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
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>
            NEXT DAILY 3 RESETS IN
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.3rem",
              fontWeight: 900,
              color: "var(--text-primary)",
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
