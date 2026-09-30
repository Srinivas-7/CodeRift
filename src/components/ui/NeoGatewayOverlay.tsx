"use client";

import React, { useState, useEffect } from "react";
import { ArrowDown, Flame, Zap, Trophy, Target, ShieldCheck } from "lucide-react";

export function NeoGatewayOverlay() {
  const [activeBadgeIdx, setActiveBadgeIdx] = useState(0);

  const perks = [
    { label: "191 STRIVER SDE PROBLEMS", icon: "⚡", bg: "#FFE600", text: "#000" },
    { label: "3 DAILY MISSIONS AT MIDNIGHT", icon: "🔥", bg: "#FF3366", text: "#FFF" },
    { label: "PRIVATE SQUAD LEADERBOARDS", icon: "🏆", bg: "#00F59B", text: "#000" },
    { label: "AUTOMATED LEETCODE & GFG VERIFY", icon: "✨", bg: "#00D2FF", text: "#000" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBadgeIdx((prev) => (prev + 1) % perks.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [perks.length]);

  const handleScrollToLogin = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: window.innerHeight * 1.8,
        behavior: "smooth",
      });
    }
  };

  const currentPerk = perks[activeBadgeIdx];

  return (
    <div className="neo-gateway-overlay-container">
      {/* Top High-Voltage Status Badge */}
      <div className="neo-gateway-top">
        <div
          className="neo-gateway-pill-badge"
          style={{
            background: currentPerk.bg,
            color: currentPerk.text,
            transition: "all 0.3s ease",
          }}
        >
          <span className="neo-gateway-badge-icon">{currentPerk.icon}</span>
          <span className="neo-gateway-badge-text">{currentPerk.label}</span>
        </div>
      </div>

      {/* Central Interactive Status Chip right above the title */}
      <div className="neo-gateway-center-chip">
        <div className="neo-arena-status-chip">
          <span className="neo-pulse-dot" />
          <span>ARENA V2.0 // READY FOR COMBAT</span>
        </div>
      </div>

      {/* Bottom Tactile Scroll-to-Login Trigger Button */}
      <div className="neo-gateway-bottom">
        <button
          onClick={handleScrollToLogin}
          type="button"
          className="neo-scroll-action-pill"
          aria-label="Scroll down to authenticate"
        >
          <div className="neo-action-badge">
            <span>GET IN</span>
          </div>

          <div className="neo-action-label-row">
            <span className="neo-action-title">SCROLL DOWN TO ENTER ARENA</span>
            <div className="neo-action-arrow-box">
              <ArrowDown size={18} strokeWidth={3} />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
