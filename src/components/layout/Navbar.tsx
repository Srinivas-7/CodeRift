"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/actions/auth";
import { ThemeToggle } from "./ThemeToggle";
import { getAvatar } from "@/data/avatars";
import {
  Flame,
  Shield,
  User,
  LogOut,
  ChevronDown,
  Award,
  Zap,
  Users,
  Map,
  Trophy,
} from "lucide-react";

interface NavbarProps {
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string;
    score?: number;
    xp: number;
    level: number;
    currentStreak: number;
    streakShields: number;
    role: string;
    leetcodeUsername?: string | null;
    gfgUsername?: string | null;
  } | null;
  unreadCount?: number;
}

export function Navbar({ user, unreadCount = 0 }: NavbarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentAvatar = user ? getAvatar(user.avatar) : null;

  const navLinks = [
    { label: "DAILY 3", href: "/dashboard" },
    { label: "SQUADS", href: "/groups" },
    { label: "ROADMAP (191)", href: "/problems" },
    { label: "LEADERBOARD", href: "/leaderboard" },
  ];

  const mobileDockLinks = [
    { label: "DAILY 3", href: user ? "/dashboard" : "/login", icon: Zap, isUser: false },
    { label: "SQUADS", href: user ? "/groups" : "/login", icon: Users, isUser: false },
    { label: "ROADMAP", href: "/problems", icon: Map, isUser: false },
    { label: "RANKS", href: "/leaderboard", icon: Trophy, isUser: false },
    { label: user ? "WARRIOR" : "LOGIN", href: user ? "/profile" : "/login", icon: User, isUser: true },
  ];

  return (
    <>
      <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--bg-surface)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "3px solid var(--border-neo-strong)",
        boxShadow: "0 4px 0px var(--shadow-neo)",
        transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div
        className="app-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "76px",
        }}
      >
        {/* Left: Neo-Brutalist Pixel Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                border: "3px solid var(--border-neo-strong)",
                background: "var(--accent-yellow)",
                padding: "4px",
                borderRadius: "6px",
                boxShadow: "3px 3px 0px var(--shadow-neo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease",
              }}
            >
              <img
                src="/logo.png"
                alt="CodeRift Logo"
                style={{
                  width: "28px",
                  height: "28px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
              <span
                className="font-pixel"
                style={{
                  fontSize: "1.9rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                  color: "var(--text-primary)",
                  textShadow: "2px 2px 0px rgba(99, 102, 241, 0.35), 3px 3px 0px var(--shadow-neo)",
                  textTransform: "uppercase",
                }}
              >
                CODE
              </span>
              <span
                className="font-pixel"
                style={{
                  fontSize: "1.9rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                  color: "var(--accent-purple)",
                  textShadow: "2px 2px 0px #C7D2FE, 3px 3px 0px var(--shadow-neo)",
                  textTransform: "uppercase",
                }}
              >
                RIFT
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Neo-Brutalist Navigation Links */}
        <nav
          style={{
            alignItems: "center",
            gap: "0.5rem",
          }}
          className="desktop-nav"
        >
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "instant" });
                  }
                }}
                className="font-grotesk"
                style={{
                  color: isActive ? "#FFFFFF" : "var(--text-primary)",
                  background: isActive ? "var(--accent-purple)" : "transparent",
                  border: isActive ? "2.5px solid var(--border-neo-strong)" : "2.5px solid transparent",
                  boxShadow: isActive ? "3px 3px 0px var(--shadow-neo)" : "none",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "0.45rem 0.95rem",
                  borderRadius: "6px",
                  transition: "all 0.12s ease",
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--accent-yellow)";
                    e.currentTarget.style.color = "#000000";
                    e.currentTarget.style.border = "2.5px solid #000000";
                    e.currentTarget.style.boxShadow = "3px 3px 0px var(--shadow-neo)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.border = "2.5px solid transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Theme Switcher & Authenticated User Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Light/Dark Mode Switcher */}
          <ThemeToggle />

          {user ? (
            <div className="desktop-user-menu" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Streak Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  border: "2.5px solid #000000",
                  background: "var(--accent-vermillion)",
                  boxShadow: "3px 3px 0px var(--shadow-neo)",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "6px",
                }}
              >
                <Flame size={16} />
                <span>{user.currentStreak}D</span>
              </div>

              {/* SCORE Counter */}
              <div
                className="desktop-score-counter"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  color: "var(--text-primary)",
                  border: "2.5px solid var(--border-neo-strong)",
                  background: "var(--bg-surface)",
                  boxShadow: "3px 3px 0px var(--shadow-neo)",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "6px",
                }}
              >
                <strong style={{ color: "var(--accent-purple)", fontWeight: 900 }}>
                  {((user.score ?? user.xp) || 0).toLocaleString()}
                </strong>
                <span>PTS</span>
              </div>

              {/* User Dropdown */}
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    background: "var(--bg-surface)",
                    border: "2.5px solid var(--border-neo-strong)",
                    boxShadow: "3px 3px 0px var(--shadow-neo)",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "6px",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontFamily: "var(--font-grotesk)",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    transition: "all 0.12s ease",
                  }}
                >
                  <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>{currentAvatar?.emoji || "🥷"}</span>
                  <span>{user.username}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.15s ease",
                    }}
                  />
                </button>

                {dropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      paddingTop: "6px",
                      zIndex: 110,
                    }}
                  >
                    <div
                      style={{
                        width: "240px",
                        background: "var(--bg-surface-solid)",
                        border: "3px solid var(--border-neo-strong)",
                        borderRadius: "6px",
                        padding: "0.5rem 0",
                        boxShadow: "6px 6px 0px var(--shadow-neo)",
                      }}
                    >
                      <div style={{ padding: "0.75rem 1rem", borderBottom: "2px solid var(--border-neo-strong)" }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                          WARRIOR IDENTITY
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
                          <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>{currentAvatar?.emoji || "🥷"}</span>
                          <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1rem" }}>
                            {user.username}
                          </span>
                        </div>
                        {user.leetcodeUsername && (
                          <div style={{ fontSize: "0.75rem", color: "#FFA116", fontFamily: "var(--font-mono)", marginTop: "0.2rem", fontWeight: 700 }}>
                            LC: @{user.leetcodeUsername}
                          </div>
                        )}
                        {user.gfgUsername && (
                          <div style={{ fontSize: "0.75rem", color: "#10B981", fontFamily: "var(--font-mono)", marginTop: "0.1rem", fontWeight: 700 }}>
                            GFG: @{user.gfgUsername}
                          </div>
                        )}
                      </div>

                      <Link
                        href="/profile"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          padding: "0.65rem 1rem",
                          color: "var(--text-primary)",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          fontFamily: "var(--font-grotesk)",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          transition: "background 0.12s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "var(--accent-yellow)", e.currentTarget.style.color = "#000000")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = "var(--text-primary)")}
                      >
                        <User size={15} color="var(--accent-purple)" /> Profile & Settings
                      </Link>

                      <Link
                        href="/achievements"
                        prefetch={true}
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          padding: "0.65rem 1rem",
                          color: "var(--text-primary)",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          fontFamily: "var(--font-grotesk)",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          transition: "background 0.12s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "var(--accent-yellow)", e.currentTarget.style.color = "#000000")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = "var(--text-primary)")}
                      >
                        <Award size={15} color="var(--accent-amber)" /> Achievement Room
                      </Link>

                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          prefetch={true}
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            padding: "0.65rem 1rem",
                            color: "var(--accent-amber)",
                            textDecoration: "none",
                            fontSize: "0.85rem",
                            fontFamily: "var(--font-grotesk)",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            transition: "background 0.12s ease",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Shield size={15} /> Admin Control
                        </Link>
                      )}

                      <div style={{ borderTop: "2px solid var(--border-neo-strong)", marginTop: "0.3rem" }}>
                        <button
                          onClick={async () => {
                            setDropdownOpen(false);
                            await logoutUser();
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            padding: "0.65rem 1rem",
                            color: "var(--accent-vermillion)",
                            fontSize: "0.85rem",
                            fontFamily: "var(--font-grotesk)",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            transition: "background 0.12s ease",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 71, 87, 0.15)")}
                          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-editorial-primary font-grotesk desktop-auth-btn"
              style={{ fontSize: "0.85rem", padding: "0.55rem 1.25rem", fontWeight: 800, letterSpacing: "0.04em", whiteSpace: "nowrap" }}
            >
              GET IN TO ARENA →
            </Link>
          )}
        </div>
      </div>
    </header>

    {/* MOBILE BOTTOM ARCADE DOCK (Only visible on mobile screens < 840px) */}
    <nav className="mobile-bottom-dock" aria-label="Mobile Navigation Dock">
      {mobileDockLinks.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;
        const isUserItem = item.isUser && user && currentAvatar;
        return (
          <Link
            key={item.label}
            href={item.href}
            prefetch={true}
            className={`mobile-dock-btn ${isActive ? "active" : ""}`}
          >
            <div className="mobile-dock-icon-wrap">
              {isUserItem ? (
                <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{currentAvatar.emoji}</span>
              ) : (
                <Icon size={19} />
              )}
            </div>
            <span className="mobile-dock-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
    </>
  );
}
