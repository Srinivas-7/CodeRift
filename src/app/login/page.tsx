"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithFirebaseAuth, updateProfile } from "@/actions/auth";
import { signInWithGooglePopup } from "@/lib/firebase";
import { AVATAR_OPTIONS } from "@/data/avatars";
import { MarioJumper } from "@/components/ui/MarioJumper";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"GATE" | "ONBOARDING">("GATE");

  // Onboarding state
  const [onboardingUsername, setOnboardingUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("cyber_ninja");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [gfgUsername, setGfgUsername] = useState("");
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
      gfgUsername: gfgUsername.trim() || undefined,
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
        position: "relative",
        minHeight: "calc(100vh - 76px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(2rem, 4vh, 3.5rem) 1.25rem",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glows */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 20% 15%, rgba(99,102,241,0.12), transparent 45%), radial-gradient(circle at 80% 25%, rgba(6,182,212,0.1), transparent 40%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.08), transparent 50%)",
          zIndex: 0,
        }}
      />

      {/* Static Mario Jumper with CODERIFT title */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", marginBottom: "2rem" }}>
        <MarioJumper />
      </div>

      {/* Login & Onboarding Card Container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {step === "GATE" ? (
          <div
            className="neo-card"
            style={{
              maxWidth: "460px",
              width: "100%",
              padding: "clamp(2rem, 4vw, 2.75rem) clamp(1.5rem, 3.5vw, 2.25rem)",
              textAlign: "center",
              background: "var(--bg-surface)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "2px solid var(--border-neo-strong)",
              borderRadius: "12px",
              boxShadow: "6px 6px 0px var(--shadow-neo)",
            }}
          >
            {/* Gamified Retro Kicker */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "var(--accent-purple)",
                marginBottom: "0.6rem",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <span>⚔️</span>
              <span>PRESS START TO PLAY</span>
            </div>

            {/* Punchy Dynamic Headline */}
            <h2
              style={{
                fontFamily: "var(--font-grotesk)",
                fontSize: "1.75rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
                textTransform: "uppercase",
              }}
            >
              READY PLAYER ONE
            </h2>

            {/* Crisp Gamified Subtitle */}
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.92rem",
                color: "var(--text-secondary)",
                lineHeight: 1.55,
                marginBottom: "1.75rem",
              }}
            >
              Solve 3 daily problems from the 191 SDE Sheet, protect your streak shield, and climb the leaderboard.
            </p>

            {/* Primary CTA: Google Sign In */}
            <div>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="btn-editorial-primary"
                style={{
                  width: "100%",
                  padding: "0.95rem 1.5rem",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-grotesk)",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  cursor: loading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                }}
              >
                {/* Google SVG Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24">
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
                <span>{loading ? "AUTHENTICATING..." : "CONTINUE WITH GOOGLE"}</span>
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  color: "var(--accent-vermillion)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  marginTop: "1rem",
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}
          </div>
          ) : (
            /* FIRST-TIME USER ONBOARDING MODAL */
            <div
              className="neo-card"
              style={{
                maxWidth: "600px",
                width: "100%",
                padding: "2.8rem 2.2rem",
                background: "var(--bg-surface)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "2px solid var(--border-neo-strong)",
                borderRadius: "12px",
                boxShadow: "8px 8px 0px var(--shadow-neo)",
              }}
            >
              <div style={{ marginBottom: "2rem" }}>
                <span className="editorial-stamp" style={{ marginBottom: "0.5rem" }}>
                  NEW PROFILE INITIALIZATION
                </span>
                <h2
                  className="font-brand"
                  style={{ fontSize: "1.6rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", color: "var(--accent-purple)" }}
                >
                  WARRIOR IDENTITY & LEETCODE
                </h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.95rem",
                    marginTop: "0.3rem",
                  }}
                >
                  Choose your public tag and connect your LeetCode profile for automated verification.
                </p>
              </div>

              {/* Tag */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                    marginBottom: "0.4rem",
                    fontWeight: 700,
                  }}
                >
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
                    border: "2px solid var(--border-neo-strong)",
                    borderRadius: "6px",
                    padding: "0.85rem 1rem",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "1rem",
                    outline: "none",
                    boxShadow: "2px 2px 0px var(--shadow-neo)",
                  }}
                />
              </div>

              {/* LeetCode Handle */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    color: "#FFA116",
                    textTransform: "uppercase",
                    marginBottom: "0.4rem",
                    fontWeight: 700,
                  }}
                >
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
                    border: "2px solid rgba(255, 161, 22, 0.6)",
                    borderRadius: "6px",
                    padding: "0.85rem 1rem",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "1rem",
                    outline: "none",
                    boxShadow: "2px 2px 0px var(--shadow-neo)",
                  }}
                />
              </div>

              {/* GeeksforGeeks Handle */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    color: "#10B981",
                    textTransform: "uppercase",
                    marginBottom: "0.4rem",
                    fontWeight: 700,
                  }}
                >
                  GeeksforGeeks Handle (@username):
                </label>
                <input
                  type="text"
                  value={gfgUsername}
                  onChange={(e) => setGfgUsername(e.target.value)}
                  placeholder="e.g. sandeepprasad"
                  style={{
                    width: "100%",
                    background: "var(--bg-primary)",
                    border: "2px solid rgba(16, 185, 129, 0.6)",
                    borderRadius: "6px",
                    padding: "0.85rem 1rem",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "1rem",
                    outline: "none",
                    boxShadow: "2px 2px 0px var(--shadow-neo)",
                  }}
                />
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: "0.3rem",
                  }}
                >
                  Allows our backend to verify your LeetCode and GeeksforGeeks submissions automatically.
                </div>
              </div>

              {/* Avatar selection */}
              <div style={{ marginBottom: "2rem" }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                    marginBottom: "0.6rem",
                    fontWeight: 700,
                  }}
                >
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
                    border: "2px solid var(--border-neo-strong)",
                    borderRadius: "6px",
                  }}
                >
                  {AVATAR_OPTIONS.map((av) => {
                    const isSelected = selectedAvatar === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.id)}
                        style={{
                          background: isSelected ? "var(--accent-purple)" : "var(--bg-surface)",
                          border: isSelected ? "2px solid var(--border-neo-strong)" : "1px solid var(--border-editorial)",
                          borderRadius: "6px",
                          boxShadow: isSelected ? "2px 2px 0px var(--shadow-neo)" : "none",
                          padding: "0.5rem 0.2rem",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.2rem",
                          cursor: "pointer",
                          transition: "all 0.12s ease",
                        }}
                      >
                        <span style={{ fontSize: "1.4rem" }}>{av.emoji}</span>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: isSelected ? "#FFF" : "var(--text-primary)",
                            fontFamily: "var(--font-grotesk)",
                            fontWeight: 700,
                          }}
                        >
                          {av.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMsg && (
                <div
                  style={{
                    color: "var(--accent-vermillion)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  ⚠️ {errorMsg}
                </div>
              )}

              <button
                type="button"
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
    </div>
  );
}
