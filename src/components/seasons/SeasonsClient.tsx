"use client";

import { useState } from "react";
import Link from "next/link";
import { updateSeasonDates } from "@/actions/seasons";
import { Calendar, Lock, Shield, Check, AlertTriangle, ArrowRight, X } from "lucide-react";

interface SeasonData {
  id: string;
  name: string;
  seasonNumber: number;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
}

interface SeasonsClientProps {
  initialSeason: SeasonData | null;
}

export function SeasonsClient({ initialSeason }: SeasonsClientProps) {
  const [season, setSeason] = useState<SeasonData | null>(initialSeason);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  
  // Format dates for HTML date input: YYYY-MM-DD
  const formatForInput = (d: string | Date | undefined) => {
    if (!d) return "";
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState(formatForInput(initialSeason?.startDate) || new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(formatForInput(initialSeason?.endDate) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart) {
      const parsedStart = new Date(newStart);
      if (!isNaN(parsedStart.getTime())) {
        const autoEnd = new Date(parsedStart.getTime() + 30 * 24 * 60 * 60 * 1000);
        setEndDate(autoEnd.toISOString().split("T")[0]);
      }
    }
  };

  const handleSaveDates = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!password) {
      setErrorMsg("Please enter the admin password.");
      return;
    }

    if (!startDate) {
      setErrorMsg("Please choose a valid start date.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await updateSeasonDates({
        seasonId: season?.id || "season_1",
        startDate,
        endDate,
        password,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to update season dates.");
      } else {
        setSuccessMsg(res.message || "Season dates updated successfully!");
        if (res.season) {
          setSeason(res.season);
        }
        setTimeout(() => {
          setIsModalOpen(false);
          setPassword("");
          setSuccessMsg("");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem 6rem", maxWidth: "1100px" }}>
      {/* Top Header */}
      <div
        style={{
          paddingBottom: "1.5rem",
          borderBottom: "1px solid var(--border-editorial)",
          marginBottom: "3rem",
        }}
      >
        <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "#FFF", marginBottom: "0.5rem" }}>
          COMPETITIVE CYCLES // 3-MONTH CADENCE
        </span>
        <h1
          className="font-grotesk"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            textTransform: "uppercase",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
          }}
        >
          SEASONS ARCHIVE.
        </h1>
      </div>

      {/* Active Season Banner */}
      {season && (
        <div
          className="editorial-card"
          style={{
            padding: "3rem",
            background: "var(--bg-surface)",
            border: "2px solid var(--accent-cobalt)",
            borderRadius: "4px",
            boxShadow: "16px 16px 0px rgba(33, 72, 255, 0.2)",
            marginBottom: "3.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <span className="editorial-stamp" style={{ borderColor: "var(--accent-acid)", color: "var(--accent-acid)", marginBottom: "0.5rem" }}>
                CURRENT ACTIVE SEASON
              </span>
              <h2 className="font-grotesk" style={{ fontSize: "2.4rem", textTransform: "uppercase", color: "#FFF" }}>
                {season.name}
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-editorial)",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Calendar size={14} style={{ color: "var(--accent-cobalt)" }} />
                <span>
                  CYCLE: <strong style={{ color: "#FFF" }}>{new Date(season.startDate).toLocaleDateString()}</strong> — <strong style={{ color: "#FFF" }}>{new Date(season.endDate).toLocaleDateString()}</strong>
                </span>
              </div>

              {/* Change Date Button */}
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="btn-editorial-outline"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.35rem 0.75rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "var(--accent-cobalt)",
                  borderColor: "rgba(33, 72, 255, 0.4)",
                  cursor: "pointer",
                }}
              >
                <Lock size={12} />
                <span>CHANGE DATE</span>
              </button>
            </div>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "680px", marginBottom: "2rem" }}>
            Season 01 introduces the 191 SDE Roadmap, squad leaderboards, and streak protection mechanics.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/leaderboard" className="btn-editorial-primary">
              VIEW SEASON STANDINGS →
            </Link>
            <Link href="/dashboard" className="btn-editorial-outline">
              SOLVE TODAY'S 3
            </Link>
          </div>
        </div>
      )}

      {/* Season History Note */}
      <div className="editorial-card" style={{ padding: "2.5rem", textAlign: "center" }}>
        <h3 className="font-grotesk" style={{ fontSize: "1.3rem", textTransform: "uppercase", color: "#FFF", marginBottom: "0.5rem" }}>
          PREVIOUS SEASONS
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          CodeRift Arena is currently in Season 01. Previous season archives will appear here once Season 01 concludes.
        </p>
      </div>

      {/* Password Protected Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !isLoading && setIsModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5, 6, 10, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 200,
          }}
        >
          <div
            className="editorial-card"
            style={{
              maxWidth: "460px",
              width: "100%",
              padding: "2.25rem",
              background: "var(--bg-surface)",
              border: "2px solid var(--accent-cobalt)",
              borderRadius: "4px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={18} style={{ color: "var(--accent-cobalt)" }} />
                <span className="font-grotesk" style={{ fontWeight: 800, fontSize: "1.1rem", textTransform: "uppercase", color: "#FFF" }}>
                  CHANGE SEASON DATES
                </span>
              </div>
              <button
                onClick={() => !isLoading && setIsModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Enter the admin password to reschedule when this competitive season begins.
            </p>

            <form onSubmit={handleSaveDates} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Start Date */}
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  Season Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-editorial)",
                    borderRadius: "3px",
                    padding: "0.65rem 0.85rem",
                    color: "#FFF",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* End Date */}
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  Season End Date (30-day default)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-editorial)",
                    borderRadius: "3px",
                    padding: "0.65rem 0.85rem",
                    color: "#FFF",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Admin Password */}
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  Admin Password (Protected)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  required
                  style={{
                    width: "100%",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-editorial)",
                    borderRadius: "3px",
                    padding: "0.65rem 0.85rem",
                    color: "#FFF",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Error / Success Feedback */}
              {errorMsg && (
                <div
                  style={{
                    padding: "0.65rem 0.85rem",
                    background: "rgba(255, 55, 20, 0.1)",
                    border: "1px solid var(--accent-vermillion)",
                    borderRadius: "3px",
                    color: "var(--accent-vermillion)",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <AlertTriangle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div
                  style={{
                    padding: "0.65rem 0.85rem",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid var(--accent-acid)",
                    borderRadius: "3px",
                    color: "var(--accent-acid)",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Check size={15} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                  className="btn-editorial-outline"
                  style={{ flex: 1, padding: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-editorial-primary"
                  style={{ flex: 2, padding: "0.75rem", fontSize: "0.85rem" }}
                >
                  {isLoading ? "UPDATING..." : "CONFIRM DATE CHANGE →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
