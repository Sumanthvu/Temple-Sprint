"use client";

import { useState } from "react";
import { FarcasterContext } from "@/types/game";

interface ScoreScreenProps {
  score: number;
  context: FarcasterContext;
  onRestart: () => void;
  onShare: () => void;
  isSaving: boolean;
}

export default function ScoreScreen({
  score,
  context,
  onRestart,
  onShare,
  isSaving,
}: ScoreScreenProps) {
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    setShared(true);
    onShare();
  };

  const getGrade = (s: number) => {
    if (s >= 2000) return { label: "LEGENDARY", color: "#ff6600", emoji: "🔥" };
    if (s >= 1000) return { label: "EPIC", color: "#cc44ff", emoji: "⚡" };
    if (s >= 500) return { label: "GREAT", color: "#FFD700", emoji: "⭐" };
    if (s >= 200) return { label: "GOOD", color: "#4aff91", emoji: "✅" };
    return { label: "KEEP TRYING", color: "#886644", emoji: "💪" };
  };

  const grade = getGrade(score);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Skull icon */}
        <div style={styles.skull}>💀</div>

        <h2 style={styles.title}>GAME OVER</h2>
        <p style={styles.username}>{context.username}</p>

        {/* Score display */}
        <div style={styles.scoreBadge}>
          <span style={styles.scoreLabel}>SCORE</span>
          <span style={styles.scoreValue}>{score.toLocaleString()}</span>
        </div>

        {/* Grade */}
        <div style={{ ...styles.grade, color: grade.color }}>
          {grade.emoji} {grade.label}
        </div>

        {isSaving && (
          <div style={styles.saving}>
            <div style={styles.dot} />
            <span>Saving score...</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={styles.buttons}>
          <button
            id="btn-play-again"
            onClick={onRestart}
            style={styles.btnPrimary}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🏃 PLAY AGAIN
          </button>

          <button
            id="btn-share-score"
            onClick={handleShare}
            disabled={shared}
            style={{
              ...styles.btnSecondary,
              opacity: shared ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !shared && (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {shared ? "✅ Cast Shared!" : "💬 Share Challenge"}
          </button>
        </div>

        {/* Tips */}
        <div style={styles.tips}>
          <p style={styles.tip}>💡 Swipe or use ← → ↑ ↓ keys</p>
          <p style={styles.tip}>🔼 Jump over tall blocks</p>
          <p style={styles.tip}>🔽 Slide under low bars</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    backdropFilter: "blur(4px)",
  },
  card: {
    background: "linear-gradient(145deg, #1a0d00, #0d0a1a)",
    border: "2px solid rgba(255, 153, 0, 0.5)",
    borderRadius: "20px",
    padding: "32px 28px",
    maxWidth: "340px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 0 60px rgba(255,100,0,0.25), 0 0 120px rgba(255,100,0,0.1)",
    animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
  },
  skull: { fontSize: "52px", marginBottom: "4px" },
  title: {
    fontFamily: "'Courier New', monospace",
    color: "#ff4400",
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0 0 4px",
    letterSpacing: "4px",
    textShadow: "0 0 20px rgba(255,68,0,0.6)",
  },
  username: {
    fontFamily: "'Courier New', monospace",
    color: "#886644",
    fontSize: "14px",
    margin: "0 0 20px",
  },
  scoreBadge: {
    background: "rgba(255,215,0,0.08)",
    border: "1px solid rgba(255,215,0,0.25)",
    borderRadius: "12px",
    padding: "14px 24px",
    marginBottom: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  scoreLabel: {
    fontFamily: "'Courier New', monospace",
    color: "#886644",
    fontSize: "11px",
    letterSpacing: "3px",
  },
  scoreValue: {
    fontFamily: "'Courier New', monospace",
    color: "#FFD700",
    fontSize: "44px",
    fontWeight: "bold",
    lineHeight: 1,
    textShadow: "0 0 20px rgba(255,215,0,0.5)",
  },
  grade: {
    fontFamily: "'Courier New', monospace",
    fontSize: "14px",
    fontWeight: "bold",
    letterSpacing: "2px",
    marginBottom: "16px",
  },
  saving: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#886644",
    fontFamily: "'Courier New', monospace",
    fontSize: "12px",
    marginBottom: "12px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#ff9900",
    animation: "pulse 0.8s ease-in-out infinite",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "16px",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #ff6600, #ff3300)",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontFamily: "'Courier New', monospace",
    fontSize: "15px",
    fontWeight: "bold",
    letterSpacing: "2px",
    padding: "13px 24px",
    cursor: "pointer",
    transition: "transform 0.15s ease",
    boxShadow: "0 4px 20px rgba(255,100,0,0.4)",
  },
  btnSecondary: {
    background: "rgba(255, 153, 0, 0.1)",
    border: "1px solid rgba(255, 153, 0, 0.4)",
    borderRadius: "10px",
    color: "#ff9900",
    fontFamily: "'Courier New', monospace",
    fontSize: "14px",
    fontWeight: "bold",
    letterSpacing: "1px",
    padding: "12px 24px",
    cursor: "pointer",
    transition: "transform 0.15s ease",
  },
  tips: {
    borderTop: "1px solid rgba(255,153,0,0.12)",
    paddingTop: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  tip: {
    fontFamily: "'Courier New', monospace",
    color: "#664433",
    fontSize: "11px",
    margin: 0,
  },
};
