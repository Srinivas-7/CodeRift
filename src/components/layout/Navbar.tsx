"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/actions/auth";
import {
  Menu,
  X,
  Flame,
  Shield,
  User,
  LogOut,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Trophy,
  Users,
  Award,
  Zap,
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
  } | null;
  unreadCount?: number;
}

export function Navbar({ user, unreadCount = 0 }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navLinks = [
    { label: "DAILY 3", href: "/dashboard" },
    { label: "SQUADS", href: "/groups" },
    { label: "ROADMAP (191)", href: "/problems" },
    { label: "LEADERBOARD", href: "/leaderboard" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10, 11, 16, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "2px solid var(--text-primary)",
        boxShadow: "0 8px 0px rgba(33, 72, 255, 0.18)",
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
        {/* Left: Editorial Logo & Masthead Label */}
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
                border: "2px solid var(--text-primary)",
                background: "var(--bg-primary)",
                padding: "3px",
                borderRadius: "2px",
                boxShadow: "3px 3px 0px var(--accent-cobalt)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
              <span
                className="font-serif"
                style={{
                  fontSize: "2rem",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: "#F5F2EB",
                }}
              >
                Code
              </span>
              <span
                className="font-grotesk"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  color: "var(--accent-cobalt)",
                  textTransform: "uppercase",
                }}
              >
                RIFT
              </span>
            </div>
          </Link>

        </div>

        {/* Center: Editorial Maximalist Navigation Links */}
        <nav
          style={{
            display: "none",
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
                  background: isActive ? "var(--accent-cobalt)" : "transparent",
                  border: isActive ? "1px solid var(--accent-cobalt)" : "1px solid transparent",
                  boxShadow: isActive ? "3px 3px 0px #000000" : "none",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "0.45rem 1rem",
                  borderRadius: "2px",
                  transition: "all 0.12s ease",
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(245, 242, 235, 0.08)";
                    e.currentTarget.style.border = "1px solid var(--border-editorial-strong)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.border = "1px solid transparent";
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Authenticated User Status or CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Streak Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  color: "var(--accent-vermillion)",
                  border: "1px solid var(--accent-vermillion)",
                  background: "rgba(255, 55, 20, 0.08)",
                  boxShadow: "2px 2px 0px rgba(255, 55, 20, 0.3)",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "2px",
                }}
              >
                <Flame size={15} />
                <span>{user.currentStreak}D STREAK</span>
              </div>

              {/* SCORE Counter */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-editorial-strong)",
                  background: "var(--bg-primary)",
                  boxShadow: "2px 2px 0px #000",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "2px",
                }}
              >
                <strong style={{ color: "var(--accent-cobalt)", fontWeight: 800 }}>
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
                    border: "2px solid var(--text-primary)",
                    boxShadow: "3px 3px 0px var(--accent-cobalt)",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "2px",
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
                        background: "var(--bg-surface)",
                        border: "2px solid var(--text-primary)",
                        borderRadius: "2px",
                        padding: "0.5rem 0",
                        boxShadow: "6px 6px 0px var(--accent-cobalt)",
                      }}
                    >
                      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-editorial)" }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                          WARRIOR IDENTITY
                        </div>
                        <div style={{ fontWeight: 800, color: "#FFF", fontSize: "1rem", marginTop: "0.2rem" }}>
                          {user.username}
                        </div>
                        {user.leetcodeUsername && (
                          <div style={{ fontSize: "0.75rem", color: "#FFA116", fontFamily: "var(--font-mono)", marginTop: "0.2rem" }}>
                            @{user.leetcodeUsername}
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
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          transition: "background 0.12s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(33, 72, 255, 0.15)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <User size={15} color="var(--accent-cobalt)" /> Profile & Settings
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
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          transition: "background 0.12s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 158, 0, 0.15)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
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
                            fontWeight: 700,
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

                      <div style={{ borderTop: "1px solid var(--border-editorial)", marginTop: "0.3rem" }}>
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
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            transition: "background 0.12s ease",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 55, 20, 0.12)")}
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
              className="btn-editorial-primary"
              style={{ fontSize: "0.85rem", padding: "0.65rem 1.4rem" }}
            >
              GET IN TO ARENA →
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "var(--bg-surface)",
              border: "2px solid var(--text-primary)",
              padding: "0.45rem",
              borderRadius: "2px",
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            background: "var(--bg-surface)",
            borderBottom: "2px solid var(--text-primary)",
            boxShadow: "0 10px 0px rgba(33, 72, 255, 0.2)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.2rem",
          }}
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="font-grotesk"
              style={{
                color: pathname === item.href ? "var(--accent-cobalt)" : "var(--text-primary)",
                textDecoration: "none",
                fontSize: "1.05rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "0.25rem 0",
              }}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <div style={{ borderTop: "1px solid var(--border-editorial)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="font-grotesk"
                style={{
                  color: "var(--text-primary)",
                  textDecoration: "none",
                  fontSize: "1rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <User size={16} /> WARRIOR PROFILE
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-grotesk"
                  style={{
                    color: "var(--accent-vermillion)",
                    textDecoration: "none",
                    fontSize: "1rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Shield size={16} /> ADMIN TELEMETRY
                </Link>
              )}
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logoutUser();
                  window.location.href = "/";
                }}
                className="font-grotesk"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-vermillion)",
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  padding: "0.25rem 0",
                  textAlign: "left",
                }}
              >
                <LogOut size={16} /> SIGN OUT
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-editorial-primary"
              style={{ textAlign: "center", marginTop: "0.5rem" }}
            >
              GET IN TO ARENA →
            </Link>
          )}
        </div>
      )}

      <style jsx>{`
        @media (min-width: 840px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
