"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useFarcaster } from "@/hooks/useFarcaster";
import ScoreScreen from "@/components/ScoreScreen";
import Leaderboard from "@/components/Leaderboard";
import { GamePhase } from "@/types/game";

// Dynamically import GameCanvas so Phaser never runs on the server
const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div style={loadingStyle}>
      <div style={spinnerStyle} />
      <span style={{ color: "#886644", fontFamily: "monospace", fontSize: "14px" }}>
        Loading Engine...
      </span>
    </div>
  ),
});

export default function HomePage() {
  const { context, isLoaded, isFarcaster, shareScore } = useFarcaster();
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "https://temple-sprint.vercel.app";

  const handleScoreUpdate = useCallback((s: number) => {
    setScore(s);
  }, []);

  const handleGameOver = useCallback(
    async (s: number) => {
      setFinalScore(s);
      setIsSaving(true);
      try {
        await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid: context.fid, score: s, username: context.username }),
        });
      } catch {
        console.warn("Score save failed (no DB?)");
      } finally {
        setIsSaving(false);
      }
    },
    [context]
  );

  const handleStart = () => {
    setScore(0);
    setFinalScore(0);
    setPhase("playing");
    setShowLeaderboard(false);
  };

  const handleRestart = useCallback(() => {
    setScore(0);
    setFinalScore(0);
    setPhase("playing");
  }, []);

  const handleShare = useCallback(() => {
    shareScore(finalScore, appUrl);
  }, [shareScore, finalScore, appUrl]);

  if (!isLoaded) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle} />
          <span style={{ color: "#886644", fontFamily: "monospace" }}>
            Connecting to Farcaster...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      {/* Top nav bar */}
      <header style={navStyle}>
        <div style={logoStyle}>
          <span style={{ fontSize: "22px" }}>🏛️</span>
          <span style={logoTextStyle}>TEMPLE SPRINT</span>
        </div>
        <div style={navRightStyle}>
          {phase === "playing" && (
            <div style={liveScoreStyle}>
              <span style={{ color: "#886644", fontSize: "12px" }}>SCORE</span>
              <span style={{ color: "#FFD700", fontSize: "20px", fontWeight: "bold" }}>
                {score}
              </span>
            </div>
          )}
          <div style={userStyle}>
            <span style={{ fontSize: "16px" }}>👤</span>
            <span style={{ color: "#c0a080", fontSize: "13px", fontFamily: "monospace" }}>
              {context.username}
            </span>
            {isFarcaster && <span style={farcasterBadge}>FC</span>}
          </div>
        </div>
      </header>

      {/* IDLE screen */}
      {phase === "idle" && (
        <div style={idleStyle}>
          {/* Hero */}
          <div style={heroStyle}>
            <div style={templeIconStyle}>🏛️</div>
            <h1 style={heroTitleStyle}>TEMPLE SPRINT</h1>
            <p style={heroSubtitleStyle}>
              Endless runner · 3 lanes · Jump · Slide · Earn badges
            </p>
            <div style={dividerStyle} />
            <p style={heroDescStyle}>
              Dodge obstacles, set high scores, and challenge your Farcaster followers.
              Weekly top runners earn on-chain achievement badges on Sepolia!
            </p>

            <button
              id="btn-start-game"
              onClick={handleStart}
              style={startBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 0 40px rgba(255,100,0,0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 0 24px rgba(255,100,0,0.4)";
              }}
            >
              ▶ PLAY NOW
            </button>

            <button
              id="btn-leaderboard"
              onClick={() => setShowLeaderboard((v) => !v)}
              style={lbBtnStyle}
            >
              🏆 Weekly Leaderboard
            </button>
          </div>

          {/* Controls card */}
          <div style={controlsCardStyle}>
            <h3 style={controlsTitleStyle}>Controls</h3>
            <div style={controlsGridStyle}>
              <ControlRow icon="⬅ ➡" label="Switch Lanes" desc="Arrow keys / Swipe" />
              <ControlRow icon="⬆" label="Jump" desc="Up arrow / Swipe up" />
              <ControlRow icon="⬇" label="Slide" desc="Down arrow / Swipe down" />
            </div>
          </div>

          {showLeaderboard && (
            <div style={{ marginTop: "20px" }}>
              <Leaderboard currentFid={context.fid} currentScore={0} />
            </div>
          )}
        </div>
      )}

      {/* PLAYING / DEAD screen */}
      {(phase === "playing" || phase === "dead") && (
        <div style={gameAreaStyle}>
          <div style={{ position: "relative" }}>
            <GameCanvas
              fid={context.fid}
              username={context.username}
              onGameOver={handleGameOver}
              onScoreUpdate={handleScoreUpdate}
              phase={phase}
              onPhaseChange={setPhase}
            />

            {phase === "dead" && (
              <ScoreScreen
                score={finalScore}
                context={context}
                onRestart={handleRestart}
                onShare={handleShare}
                isSaving={isSaving}
              />
            )}
          </div>

          {phase === "dead" && (
            <div style={{ marginTop: "20px" }}>
              <Leaderboard currentFid={context.fid} currentScore={finalScore} />
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes flicker {
          0%,100% { opacity: 1; } 50% { opacity: 0.8; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: #05030d; }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </main>
  );
}

// ─── Small helpers ────────────────────────────────────────────────
function ControlRow({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0" }}>
      <span style={{ fontSize: "18px", minWidth: "40px", textAlign: "center" }}>{icon}</span>
      <div>
        <p style={{ margin: 0, color: "#c0a080", fontFamily: "monospace", fontSize: "13px", fontWeight: "bold" }}>
          {label}
        </p>
        <p style={{ margin: 0, color: "#664433", fontFamily: "monospace", fontSize: "11px" }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #05030d 0%, #0d0808 100%)",
  color: "#e0c8a0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const navStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "700px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 20px",
  borderBottom: "1px solid rgba(255,153,0,0.15)",
};

const logoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const logoTextStyle: React.CSSProperties = {
  fontFamily: "'Courier New', monospace",
  fontSize: "16px",
  fontWeight: "bold",
  color: "#FFD700",
  letterSpacing: "3px",
  textShadow: "0 0 12px rgba(255,215,0,0.4)",
};

const navRightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const liveScoreStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  lineHeight: 1,
};

const userStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const farcasterBadge: React.CSSProperties = {
  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
  color: "#fff",
  fontSize: "9px",
  fontWeight: "bold",
  padding: "2px 5px",
  borderRadius: "4px",
  fontFamily: "monospace",
};

const idleStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "600px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "16px",
};

const heroStyle: React.CSSProperties = {
  textAlign: "center",
  width: "100%",
};

const templeIconStyle: React.CSSProperties = {
  fontSize: "64px",
  display: "block",
  marginBottom: "8px",
  animation: "flicker 2s ease-in-out infinite",
};

const heroTitleStyle: React.CSSProperties = {
  fontFamily: "'Courier New', monospace",
  fontSize: "clamp(28px, 8vw, 48px)",
  fontWeight: "bold",
  color: "#FFD700",
  letterSpacing: "6px",
  margin: "0 0 8px",
  textShadow: "0 0 30px rgba(255,215,0,0.5), 0 0 60px rgba(255,100,0,0.3)",
};

const heroSubtitleStyle: React.CSSProperties = {
  fontFamily: "'Courier New', monospace",
  color: "#886644",
  fontSize: "13px",
  letterSpacing: "2px",
  margin: "0 0 16px",
};

const dividerStyle: React.CSSProperties = {
  width: "60px",
  height: "2px",
  background: "linear-gradient(90deg, transparent, #ff6600, transparent)",
  margin: "0 auto 16px",
};

const heroDescStyle: React.CSSProperties = {
  fontFamily: "'Courier New', monospace",
  color: "#664433",
  fontSize: "13px",
  lineHeight: 1.6,
  maxWidth: "380px",
  margin: "0 auto 24px",
};

const startBtnStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ff6600, #cc3300)",
  border: "none",
  borderRadius: "14px",
  color: "#fff",
  fontFamily: "'Courier New', monospace",
  fontSize: "18px",
  fontWeight: "bold",
  letterSpacing: "4px",
  padding: "16px 48px",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  boxShadow: "0 0 24px rgba(255,100,0,0.4)",
  display: "block",
  margin: "0 auto 14px",
};

const lbBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,153,0,0.3)",
  borderRadius: "8px",
  color: "#886644",
  fontFamily: "'Courier New', monospace",
  fontSize: "13px",
  padding: "8px 20px",
  cursor: "pointer",
};

const controlsCardStyle: React.CSSProperties = {
  background: "rgba(255,153,0,0.04)",
  border: "1px solid rgba(255,153,0,0.12)",
  borderRadius: "12px",
  padding: "16px 20px",
  width: "100%",
  maxWidth: "320px",
};

const controlsTitleStyle: React.CSSProperties = {
  fontFamily: "'Courier New', monospace",
  color: "#886644",
  fontSize: "11px",
  letterSpacing: "3px",
  margin: "0 0 10px",
};

const controlsGridStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0",
  borderTop: "1px solid rgba(255,153,0,0.1)",
};

const gameAreaStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "700px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const loadingStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "200px",
  gap: "12px",
};

const spinnerStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  border: "3px solid rgba(255,153,0,0.2)",
  borderTop: "3px solid #ff9900",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};
