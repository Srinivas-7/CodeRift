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
} from "lucide-react";

interface NavbarProps {
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string;
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
    { label: "SEASONS", href: "/seasons" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10, 11, 16, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-editorial)",
      }}
    >
      <div
        className="app-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
        }}
      >
        {/* Left: Editorial Logo & Masthead Label */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
            }}
          >
            <img
              src="/logo.png"
              alt="CodeRift Logo"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                objectFit: "contain",
              }}
            />
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
              <span
                className="font-serif"
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                Code
              </span>
              <span
                className="font-grotesk"
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "var(--accent-cobalt)",
                }}
              >
                RIFT
              </span>
            </div>
          </Link>

          <span
            className="editorial-stamp"
            style={{
              display: "none",
              fontSize: "0.65rem",
              borderColor: "var(--border-editorial)",
              color: "var(--text-muted)",
            }}
          >
            VOL. 191 / 3 DAILY
          </span>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav
          style={{
            display: "none",
            alignItems: "center",
            gap: "2.2rem",
          }}
          className="desktop-nav"
        >
          {navLinks.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className="font-grotesk"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  position: "relative",
                  padding: "0.4rem 0",
                  transition: "color 0.15s ease",
                  borderBottom: isActive ? "2px solid var(--accent-cobalt)" : "2px solid transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Authenticated User Status or CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* Streak Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--accent-vermillion)",
                  border: "1px solid rgba(255, 55, 20, 0.25)",
                  background: "rgba(255, 55, 20, 0.06)",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "2px",
                }}
              >
                <Flame size={15} />
                <span>{user.currentStreak}D</span>
              </div>

              {/* XP Counter */}
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                <strong style={{ color: "var(--text-primary)" }}>{user.xp.toLocaleString()}</strong> XP
              </div>

              {/* User Dropdown (Opens on Hover & Click) */}
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    background: dropdownOpen ? "rgba(33, 72, 255, 0.12)" : "var(--bg-surface)",
                    border: dropdownOpen ? "1px solid var(--accent-cobalt)" : "1px solid var(--border-editorial)",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "4px",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontFamily: "var(--font-grotesk)",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{user.username}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      opacity: 0.8,
                      transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
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
                        width: "220px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-editorial-strong)",
                        borderRadius: "4px",
                        padding: "0.5rem 0",
                        boxShadow: "0 15px 35px rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-editorial)" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                          Signed in as
                        </div>
                        <div style={{ fontWeight: 700, color: "#FFF", fontSize: "0.95rem" }}>
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
                          transition: "background 0.15s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <User size={15} /> My Profile & Settings
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
                          transition: "background 0.15s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Award size={15} /> Achievement Room
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
                            transition: "background 0.15s ease",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Shield size={15} /> Admin Dataset Control
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
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            transition: "background 0.15s ease",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 55, 20, 0.08)")}
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
              background: "none",
              border: "1px solid var(--border-editorial)",
              padding: "0.4rem",
              borderRadius: "4px",
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
            borderBottom: "1px solid var(--border-editorial)",
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
                fontWeight: 700,
                textTransform: "uppercase",
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
                  fontWeight: 700,
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
                    fontWeight: 700,
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
                  fontWeight: 700,
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
          .editorial-stamp {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
