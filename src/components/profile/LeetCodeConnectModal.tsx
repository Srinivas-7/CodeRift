"use client";

import { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
  ShieldCheck,
  Search,
  Unlink,
  Sparkles,
  Award,
} from "lucide-react";
import { connectLeetCodeAccount, disconnectLeetCodeAccount, checkLeetCodeAccount } from "@/actions/auth";

interface LeetCodeConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHandle?: string | null;
  onHandleUpdated?: (newHandle: string | null) => void;
}

export function LeetCodeConnectModal({
  isOpen,
  onClose,
  currentHandle,
  onHandleUpdated,
}: LeetCodeConnectModalProps) {
  const [handle, setHandle] = useState(currentHandle || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    exists?: boolean;
    profile?: {
      username: string;
      realName?: string;
      userAvatar?: string;
      ranking?: number;
      totalSolved?: number;
      easySolved?: number;
      mediumSolved?: number;
      hardSolved?: number;
    };
    error?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync state when modal opens or handle changes
  useEffect(() => {
    if (isOpen) {
      setHandle(currentHandle || "");
      setVerificationResult(null);
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, currentHandle]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanHandle = handle.trim().replace(/^@/, "");

  const handleVerify = async () => {
    if (!cleanHandle) {
      setErrorMsg("Please enter a LeetCode username to verify.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg("");
    setSuccessMsg("");
    setVerificationResult(null);

    try {
      const res = await checkLeetCodeAccount(cleanHandle);
      if (res.success && res.exists) {
        setVerificationResult(res);
      } else {
        setVerificationResult(null);
        setErrorMsg(res.error || `No LeetCode profile found for @${cleanHandle}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not verify handle. You can still save it directly.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!cleanHandle) {
      setErrorMsg("Please enter a valid LeetCode handle.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await connectLeetCodeAccount(cleanHandle);
      if (res.success) {
        setSuccessMsg(`✓ LeetCode account @${res.leetcodeUsername} connected successfully!`);
        if (onHandleUpdated) {
          onHandleUpdated(res.leetcodeUsername || null);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || "Failed to link LeetCode account.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save handle.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your LeetCode handle? Submission auto-verifications will be paused.")) {
      return;
    }

    setIsDisconnecting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await disconnectLeetCodeAccount();
      if (res.success) {
        setSuccessMsg("✓ LeetCode account disconnected.");
        setHandle("");
        setVerificationResult(null);
        if (onHandleUpdated) {
          onHandleUpdated(null);
        }
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.error || "Failed to disconnect account.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to disconnect.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1000,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="editorial-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "540px",
          width: "100%",
          padding: "2.25rem",
          background: "var(--bg-surface)",
          border: "2px solid #FFA116",
          borderRadius: "6px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 161, 22, 0.2)",
          position: "relative",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        {/* Header bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span
                className="editorial-stamp"
                style={{
                  borderColor: "#FFA116",
                  color: "#FFA116",
                  background: "rgba(255, 161, 22, 0.1)",
                  fontSize: "0.7rem",
                  padding: "0.15rem 0.5rem",
                }}
              >
                AUTOMATED SYNC ENGINE
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  color: currentHandle ? "var(--accent-acid)" : "var(--text-muted)",
                }}
              >
                {currentHandle ? "● CONNECTED" : "○ NOT LINKED"}
              </span>
            </div>
            <h2 className="font-grotesk" style={{ fontSize: "1.45rem", textTransform: "uppercase", color: "#FFF", margin: 0 }}>
              CONNECT LEETCODE HANDLE
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-editorial)",
              color: "var(--text-secondary)",
              width: "32px",
              height: "32px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Close Window"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subtitle description */}
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
          Link your public LeetCode handle so the arena can automatically verify your Striver SDE Sheet submissions, daily challenge completions, and award squad points in real-time.
        </p>

        {/* Input & Verification Box */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "#FFA116",
              marginBottom: "0.4rem",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            LeetCode Username / Handle
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span
                style={{
                  position: "absolute",
                  left: "0.85rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                }}
              >
                @
              </span>
              <input
                type="text"
                placeholder="e.g. tour_de_code"
                value={cleanHandle}
                onChange={(e) => {
                  setHandle(e.target.value);
                  setErrorMsg("");
                  setVerificationResult(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.75rem 0.75rem 0.75rem 2.2rem",
                  background: "var(--bg-primary)",
                  border: "1px solid rgba(255, 161, 22, 0.4)",
                  borderRadius: "3px",
                  color: "#FFF",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.95rem",
                  outline: "none",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
                }}
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying || !cleanHandle}
              className="btn-editorial-outline"
              style={{
                padding: "0 1rem",
                fontSize: "0.8rem",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                border: "1px solid var(--border-editorial)",
              }}
              title="Check if user exists on LeetCode"
            >
              {isVerifying ? (
                <span>Checking...</span>
              ) : (
                <>
                  <Search size={14} /> Verify
                </>
              )}
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "0.4rem",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}
          >
            <span>Example: If your URL is leetcode.com/u/alice, enter &quot;alice&quot;</span>
            {cleanHandle && (
              <a
                href={`https://leetcode.com/u/${cleanHandle}/`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#FFA116", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
              >
                View on LeetCode <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Live Profile Preview if Verified */}
        {verificationResult?.profile && (
          <div
            style={{
              background: "rgba(33, 72, 255, 0.08)",
              border: "1px solid var(--accent-cobalt)",
              borderRadius: "4px",
              padding: "1rem 1.25rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                {verificationResult.profile.userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={verificationResult.profile.userAvatar}
                    alt={verificationResult.profile.username}
                    style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #FFA116" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(255, 161, 22, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFA116",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    LC
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, color: "#FFF", fontSize: "0.9rem" }}>
                    {verificationResult.profile.realName || verificationResult.profile.username}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#FFA116" }}>
                    @{verificationResult.profile.username}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  color: "var(--accent-acid)",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={14} /> ACCOUNT VERIFIED
              </div>
            </div>

            {/* Solved stats pill grid */}
            {verificationResult.profile.totalSolved !== undefined && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", textAlign: "center" }}>
                <div style={{ background: "var(--bg-primary)", padding: "0.4rem", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 800, color: "#FFF" }}>
                    {verificationResult.profile.totalSolved}
                  </div>
                  <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>SOLVED</div>
                </div>
                <div style={{ background: "var(--bg-primary)", padding: "0.4rem", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-acid)" }}>
                    {verificationResult.profile.easySolved || 0}
                  </div>
                  <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>EASY</div>
                </div>
                <div style={{ background: "var(--bg-primary)", padding: "0.4rem", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-amber)" }}>
                    {verificationResult.profile.mediumSolved || 0}
                  </div>
                  <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>MED</div>
                </div>
                <div style={{ background: "var(--bg-primary)", padding: "0.4rem", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-vermillion)" }}>
                    {verificationResult.profile.hardSolved || 0}
                  </div>
                  <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>HARD</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255, 68, 56, 0.12)",
              border: "1px solid var(--accent-vermillion)",
              padding: "0.75rem 1rem",
              borderRadius: "4px",
              color: "var(--accent-vermillion)",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(0, 245, 160, 0.12)",
              border: "1px solid var(--accent-acid)",
              padding: "0.75rem 1rem",
              borderRadius: "4px",
              color: "var(--accent-acid)",
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Security & Verification Note */}
        <div
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-editorial)",
            borderRadius: "4px",
            padding: "0.85rem 1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.6rem",
          }}
        >
          <ShieldCheck size={18} style={{ color: "var(--accent-cobalt)", marginTop: "2px", flexShrink: 0 }} />
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
            <strong style={{ color: "var(--text-primary)" }}>Zero-Password Public Verification:</strong> We only query LeetCode&apos;s public GraphQL API for &apos;Accepted&apos; submissions. Your account credentials and private data are never required.
          </div>
        </div>

        {/* Actions bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {currentHandle ? (
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting || isSaving}
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 68, 56, 0.4)",
                color: "var(--accent-vermillion)",
                padding: "0.65rem 1rem",
                borderRadius: "3px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Unlink size={13} /> {isDisconnecting ? "Unlinking..." : "Disconnect Handle"}
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginLeft: "auto" }}>
            <button
              onClick={onClose}
              className="btn-editorial-outline"
              style={{ padding: "0.65rem 1.25rem", fontSize: "0.85rem" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !cleanHandle}
              className="btn-editorial-primary"
              style={{
                padding: "0.65rem 1.5rem",
                fontSize: "0.85rem",
                background: "#FFA116",
                color: "#000",
                borderColor: "#FFA116",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontWeight: 800,
              }}
            >
              <Sparkles size={14} />
              {isSaving ? "Saving..." : currentHandle ? "Update Connection" : "Connect Handle"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
