"use client";

import React, { useState, useEffect } from "react";

export function MarioJumper() {
  const [activeSpeech, setActiveSpeech] = useState("👋 HI THERE! LET'S-A GO!");
  const [activePose, setActivePose] = useState<"stand" | "jump" | "dance">("stand");

  useEffect(() => {
    // Timed choreography matching the 11.5s CSS jump cycle
    const timeline = [
      { time: 0, speech: "👋 HI THERE! LET'S-A GO!", pose: "stand" as const },
      { time: 900, speech: "🍄 LET'S JUMP!", pose: "jump" as const },
      { time: 1700, speech: "⭐ C -> O!", pose: "stand" as const },
      { time: 2400, speech: "💨 O -> D!", pose: "jump" as const },
      { time: 3200, speech: "🪙 191 SDE PROBLEMS!", pose: "stand" as const },
      { time: 3900, speech: "🚀 D -> E!", pose: "jump" as const },
      { time: 4700, speech: "⚡ 3 DAILY CHALLENGES!", pose: "stand" as const },
      { time: 5400, speech: "🔥 E -> R!", pose: "jump" as const },
      { time: 6200, speech: "🎮 SQUAD BATTLES!", pose: "stand" as const },
      { time: 6900, speech: "💨 R -> I!", pose: "jump" as const },
      { time: 7700, speech: "🏅 LEETCODE & GFG!", pose: "stand" as const },
      { time: 8500, speech: "💥 I -> F -> T!", pose: "jump" as const },
      { time: 9200, speech: "👑 YAHOO! VICTORY DANCE!", pose: "dance" as const },
      { time: 10600, speech: "✨ YOU DID IT!", pose: "dance" as const },
    ];

    let timers: NodeJS.Timeout[] = [];

    const runTimeline = () => {
      timeline.forEach(({ time, speech, pose }) => {
        const t = setTimeout(() => {
          setActiveSpeech(speech);
          setActivePose(pose);
        }, time);
        timers.push(t);
      });
    };

    runTimeline();
    const loopInterval = setInterval(() => {
      timers.forEach(clearTimeout);
      timers = [];
      runTimeline();
    }, 11500);

    return () => {
      clearInterval(loopInterval);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "920px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
      }}
    >
      {/* Container holding the CODERIFT Title and Mario Track */}
      <div
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem 0 0.5rem 0",
        }}
      >
        {/* The Big Bold Static Pixel Title CODERIFT */}
        <div
          className="font-pixel"
          style={{
            fontSize: "clamp(3.5rem, 11vw, 7.5rem)",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "0.03em",
            color: "var(--text-primary)",
            textShadow: "3px 3px 0px rgba(99, 102, 241, 0.4), 6px 6px 0px var(--shadow-neo)",
            userSelect: "none",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <span>CODE</span>
          <span style={{ color: "var(--accent-purple)", textShadow: "3px 3px 0px #C7D2FE, 6px 6px 0px var(--shadow-neo)" }}>
            RIFT
          </span>
        </div>

        {/* Mario Jumping Track directly on top of the 8 letters C-O-D-E-R-I-F-T */}
        <div className="mario-letters-track-static">
          {/* Animated Mario Character - Always solid opacity */}
          <div className={`mario-character-runner mario-pose-${activePose}`}>
            {/* Animated Pixel Speech Bubble */}
            <div className="mario-speech-bubble-wrapper">
              <span>{activeSpeech}</span>
            </div>

            {/* 100% Authentic NES Super Mario Sprite */}
            <div className="mario-sprite-art">
            {activePose === "jump" ? (
              /* AUTHENTIC NES MARIO JUMP (Iconic World 1-1 Jumping Pose) */
              <svg
                width="54"
                height="64"
                viewBox="0 0 16 16"
                style={{ display: "block" }}
                shapeRendering="crispEdges"
              >
                {/* Raised Right Hand (White Glove Punching Up) */}
                <rect x="11" y="0" width="3" height="3" fill="#FFFFFF" />
                <rect x="11" y="2" width="1" height="1" fill="#9CA3AF" />

                {/* Red Cap */}
                <rect x="3" y="1" width="5" height="1" fill="#E52521" />
                <rect x="2" y="2" width="9" height="1" fill="#E52521" />
                <rect x="10" y="1" width="2" height="4" fill="#E52521" />

                {/* Hair & Sideburns (Dark Brown) */}
                <rect x="2" y="3" width="3" height="1" fill="#582900" />
                <rect x="1" y="4" width="1" height="3" fill="#582900" />
                <rect x="2" y="4" width="1" height="1" fill="#582900" />
                <rect x="2" y="5" width="2" height="1" fill="#582900" />

                {/* Eye & Mustache (Black / Dark Brown) */}
                <rect x="7" y="3" width="1" height="1" fill="#000000" />
                <rect x="7" y="4" width="1" height="1" fill="#582900" />
                <rect x="8" y="5" width="3" height="1" fill="#582900" />
                <rect x="7" y="6" width="1" height="1" fill="#582900" />

                {/* Face & Nose (Peach Skin) */}
                <rect x="5" y="3" width="2" height="1" fill="#FECB8E" />
                <rect x="3" y="4" width="4" height="1" fill="#FECB8E" />
                <rect x="8" y="4" width="3" height="1" fill="#FECB8E" />
                <rect x="4" y="5" width="4" height="1" fill="#FECB8E" />
                <rect x="3" y="6" width="4" height="1" fill="#FECB8E" />
                <rect x="8" y="6" width="2" height="1" fill="#FECB8E" />

                {/* Red Shirt */}
                <rect x="3" y="7" width="2" height="3" fill="#E52521" />
                <rect x="6" y="7" width="4" height="2" fill="#E52521" />

                {/* Left Hand (White Glove Down) */}
                <rect x="1" y="8" width="2" height="2" fill="#FFFFFF" />

                {/* Blue Overalls */}
                <rect x="5" y="7" width="1" height="3" fill="#0038D6" />
                <rect x="9" y="7" width="1" height="3" fill="#0038D6" />
                <rect x="4" y="9" width="7" height="3" fill="#0038D6" />
                <rect x="2" y="11" width="3" height="2" fill="#0038D6" />
                <rect x="10" y="10" width="3" height="2" fill="#0038D6" />

                {/* Yellow Buttons */}
                <rect x="5" y="9" width="1" height="1" fill="#FFD700" />
                <rect x="9" y="9" width="1" height="1" fill="#FFD700" />

                {/* Brown Work Shoes (Jumping Pose) */}
                <rect x="1" y="13" width="4" height="2" fill="#683A00" />
                <rect x="11" y="12" width="4" height="2" fill="#683A00" />
              </svg>
            ) : activePose === "dance" ? (
              /* AUTHENTIC MARIO VICTORY DANCE (Both hands high with classic smile!) */
              <svg
                width="54"
                height="64"
                viewBox="0 0 16 16"
                style={{ display: "block" }}
                shapeRendering="crispEdges"
              >
                {/* Both Hands Up (White Gloves) */}
                <rect x="0" y="1" width="3" height="3" fill="#FFFFFF" />
                <rect x="13" y="1" width="3" height="3" fill="#FFFFFF" />

                {/* Red Cap */}
                <rect x="4" y="0" width="8" height="2" fill="#E52521" />
                <rect x="3" y="2" width="10" height="1" fill="#E52521" />

                {/* Hair & Eyes */}
                <rect x="3" y="3" width="2" height="2" fill="#582900" />
                <rect x="11" y="3" width="2" height="2" fill="#582900" />
                <rect x="5" y="3" width="1" height="1" fill="#000000" />
                <rect x="10" y="3" width="1" height="1" fill="#000000" />

                {/* Face & Big Cheerful Mustache */}
                <rect x="6" y="3" width="4" height="2" fill="#FECB8E" />
                <rect x="4" y="4" width="2" height="2" fill="#FECB8E" />
                <rect x="10" y="4" width="2" height="2" fill="#FECB8E" />
                <rect x="5" y="5" width="6" height="1" fill="#582900" />

                {/* Red Shirt Sleeves */}
                <rect x="2" y="4" width="2" height="3" fill="#E52521" />
                <rect x="12" y="4" width="2" height="3" fill="#E52521" />
                <rect x="4" y="6" width="8" height="2" fill="#E52521" />

                {/* Blue Overalls */}
                <rect x="4" y="8" width="8" height="4" fill="#0038D6" />
                <rect x="5" y="7" width="2" height="1" fill="#FFD700" />
                <rect x="9" y="7" width="2" height="1" fill="#FFD700" />

                {/* Brown Shoes */}
                <rect x="2" y="12" width="4" height="3" fill="#683A00" />
                <rect x="10" y="12" width="4" height="3" fill="#683A00" />
              </svg>
            ) : (
              /* CLASSIC 8-BIT NES SUPER MARIO (Standing / Ready Stance) */
              <svg
                width="54"
                height="64"
                viewBox="0 0 16 16"
                style={{ display: "block" }}
                shapeRendering="crispEdges"
              >
                {/* Red Cap */}
                <rect x="3" y="1" width="5" height="1" fill="#E52521" />
                <rect x="2" y="2" width="9" height="1" fill="#E52521" />

                {/* Hair & Sideburns (Dark Brown) */}
                <rect x="2" y="3" width="3" height="1" fill="#582900" />
                <rect x="1" y="4" width="1" height="3" fill="#582900" />
                <rect x="2" y="4" width="1" height="1" fill="#582900" />
                <rect x="2" y="5" width="2" height="1" fill="#582900" />

                {/* Eye & Mustache (Black / Dark Brown) */}
                <rect x="7" y="3" width="1" height="1" fill="#000000" />
                <rect x="7" y="4" width="1" height="1" fill="#582900" />
                <rect x="8" y="5" width="4" height="1" fill="#582900" />
                <rect x="7" y="6" width="1" height="1" fill="#582900" />

                {/* Face Skin & Nose (Peach) */}
                <rect x="5" y="3" width="2" height="1" fill="#FECB8E" />
                <rect x="3" y="4" width="4" height="1" fill="#FECB8E" />
                <rect x="8" y="4" width="3" height="1" fill="#FECB8E" />
                <rect x="4" y="5" width="4" height="1" fill="#FECB8E" />
                <rect x="3" y="6" width="4" height="1" fill="#FECB8E" />
                <rect x="8" y="6" width="3" height="1" fill="#FECB8E" />

                {/* Red Shirt */}
                <rect x="3" y="7" width="2" height="3" fill="#E52521" />
                <rect x="6" y="7" width="4" height="2" fill="#E52521" />
                <rect x="11" y="7" width="2" height="3" fill="#E52521" />
                <rect x="2" y="8" width="1" height="2" fill="#E52521" />
                <rect x="13" y="8" width="1" height="2" fill="#E52521" />

                {/* White Gloves */}
                <rect x="1" y="10" width="2" height="2" fill="#FFFFFF" />
                <rect x="13" y="10" width="2" height="2" fill="#FFFFFF" />

                {/* Blue Overalls */}
                <rect x="5" y="7" width="1" height="4" fill="#0038D6" />
                <rect x="10" y="7" width="1" height="4" fill="#0038D6" />
                <rect x="4" y="9" width="8" height="2" fill="#0038D6" />
                <rect x="3" y="11" width="10" height="2" fill="#0038D6" />
                <rect x="4" y="13" width="3" height="1" fill="#0038D6" />
                <rect x="9" y="13" width="3" height="1" fill="#0038D6" />

                {/* Brown Work Shoes */}
                <rect x="2" y="14" width="4" height="2" fill="#683A00" />
                <rect x="10" y="14" width="4" height="2" fill="#683A00" />
              </svg>
            )}
            </div>
          </div>

          {/* Landing Dust Puffs & FX */}
          <div className="mario-dust-puff">💨</div>
          <div className="mario-fx-coin">🪙</div>
          <div className="mario-fx-star">✨</div>
        </div>
      </div>
    </div>
  );
}



