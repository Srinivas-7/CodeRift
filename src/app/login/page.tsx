"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithFirebaseAuth, updateProfile } from "@/actions/auth";
import { signInWithGooglePopup } from "@/lib/firebase";
import { AVATAR_OPTIONS } from "@/data/avatars";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"GATE" | "ONBOARDING">("GATE");

  // Onboarding state
  const [onboardingUsername, setOnboardingUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("cyber_ninja");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      let email = "";
      let name = "";
      let uid = "";

      try {
        const firebaseUser = await signInWithGooglePopup();
        email = firebaseUser.email;
        name = firebaseUser.name;
        uid = firebaseUser.uid;
      } catch (popupErr: any) {
        console.warn("Firebase popup error:", popupErr);
        setErrorMsg(popupErr?.message || "Google sign-in was cancelled or failed.");
        setLoading(false);
        return;
      }

      const res = await loginWithFirebaseAuth({
        email,
        name,
        firebaseUid: uid,
        provider: "google",
      });

      if (res.success) {
        if (res.isNewUser) {
          setOnboardingUsername(res.user!.username);
          setStep("ONBOARDING");
          setLoading(false);
        } else {
          router.push("/dashboard");
        }
      } else {
        setErrorMsg(res.error || "Authentication failed.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate with Google.");
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!onboardingUsername.trim()) {
      setErrorMsg("Please enter your warrior tag.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    const res = await updateProfile({
      username: onboardingUsername,
      avatar: selectedAvatar,
      leetcodeUsername: leetcodeUsername.trim() || undefined,
    });

    if (res.success) {
      router.push("/dashboard");
    } else {
      setErrorMsg(res.error || "Could not save profile.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
      }}
    >
      {step === "GATE" ? (
        <div
          className="editorial-card"
          style={{
            maxWidth: "680px",
            width: "100%",
            padding: "clamp(2.5rem, 6vw, 4rem) clamp(1.25rem, 4vw, 3rem)",
            textAlign: "center",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-editorial-strong)",
            borderRadius: "4px",
            boxShadow: "20px 20px 0px rgba(33, 72, 255, 0.2)",
          }}
        >
          {/* Top Label */}
          <div style={{ marginBottom: "1.5rem" }}>
            <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "#FFF" }}>
              ENTRY GATE // 191 SDE PROBLEMS
            </span>
          </div>

          {/* Poster Typography */}
          <h1
            className="font-grotesk"
            style={{
              fontSize: "clamp(2.8rem, 8vw, 4.8rem)",
              lineHeight: 0.92,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.04em",
              marginBottom: "1rem",
            }}
          >
            CODE <span style={{ color: "var(--accent-cobalt)" }}>RIFT</span>
          </h1>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              marginBottom: "3rem",
            }}
          >
            <div className="font-serif" style={{ fontSize: "2rem", color: "var(--text-primary)" }}>
              191 Problems.
            </div>
            <div className="font-grotesk" style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-vermillion)", textTransform: "uppercase" }}>
              Three Every Day.
            </div>
            <div className="font-serif serif-italic" style={{ fontSize: "1.8rem", color: "var(--text-secondary)" }}>
              Beat your friends on the leaderboard.
            </div>
          </div>

          {/* Primary CTA: Google Sign In */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="btn-editorial-primary"
              style={{
                width: "100%",
                padding: "1.25rem 2rem",
                fontSize: "1.15rem",
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
              }}
            >
              {/* Google SVG Icon */}
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
              <span>{loading ? "AUTHENTICATING..." : "GET IN TO ARENA"}</span>
            </button>
          </div>

          {errorMsg && (
            <div style={{ color: "var(--accent-vermillion)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", marginTop: "1rem" }}>
              ⚠️ {errorMsg}
            </div>
          )}
        </div>
      ) : (
        /* FIRST-TIME USER ONBOARDING MODAL */
        <div
          className="editorial-card"
          style={{
            maxWidth: "600px",
            width: "100%",
            padding: "3rem 2.5rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--text-primary)",
            borderRadius: "4px",
            boxShadow: "16px 16px 0px var(--accent-cobalt)",
          }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "var(--accent-cobalt)", marginBottom: "0.5rem" }}>
              NEW PROFILE INITIALIZATION
            </span>
            <h2 className="font-grotesk" style={{ fontSize: "1.8rem", textTransform: "uppercase", color: "#FFF" }}>
              WARRIOR IDENTITY & LEETCODE
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.3rem" }}>
              Choose your public tag and connect your LeetCode profile for automated verification.
            </p>
          </div>

          {/* Tag */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Warrior Tag:
            </label>
            <input
              type="text"
              value={onboardingUsername}
              onChange={(e) => setOnboardingUsername(e.target.value)}
              placeholder="e.g. CodeSlayer"
              maxLength={20}
              style={{
                width: "100%",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-editorial)",
                borderRadius: "2px",
                padding: "0.85rem 1rem",
                color: "#FFFFFF",
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
                outline: "none",
              }}
            />
          </div>

          {/* LeetCode Handle */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#FFA116", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              LeetCode Handle (@username):
            </label>
            <input
              type="text"
              value={leetcodeUsername}
              onChange={(e) => setLeetcodeUsername(e.target.value)}
              placeholder="e.g. neetcode"
              style={{
                width: "100%",
                background: "var(--bg-primary)",
                border: "1px solid rgba(255, 161, 22, 0.4)",
                borderRadius: "2px",
                padding: "0.85rem 1rem",
                color: "#FFFFFF",
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
                outline: "none",
              }}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Allows our backend to verify your accepted submissions automatically.
            </div>
          </div>

          {/* Avatar selection */}
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "0.6rem" }}>
              Avatar Persona:
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(75px, 1fr))",
                gap: "0.65rem",
                maxHeight: "160px",
                overflowY: "auto",
                padding: "0.5rem",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-editorial)",
              }}
            >
              {AVATAR_OPTIONS.map((av) => {
                const isSelected = selectedAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.id)}
                    style={{
                      background: isSelected ? "var(--accent-cobalt)" : "rgba(255, 255, 255, 0.03)",
                      border: isSelected ? "1px solid #FFF" : "1px solid var(--border-editorial)",
                      borderRadius: "2px",
                      padding: "0.5rem 0.2rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.2rem",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "1.4rem" }}>{av.emoji}</span>
                    <span style={{ fontSize: "0.65rem", color: "#FFF", fontFamily: "var(--font-grotesk)" }}>{av.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: "var(--accent-vermillion)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            onClick={handleCompleteOnboarding}
            disabled={loading}
            className="btn-editorial-primary"
            style={{ width: "100%", padding: "1.1rem", fontSize: "1rem" }}
          >
            ENTER THE ARENA →
          </button>
        </div>
      )}
    </div>
  );
}
