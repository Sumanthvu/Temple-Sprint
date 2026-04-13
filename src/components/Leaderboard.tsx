"use client";

import { useEffect, useState } from "react";
import { LeaderboardEntry } from "@/types/game";

interface LeaderboardProps {
  currentFid: number;
  currentScore: number;
}

export default function Leaderboard({ currentFid, currentScore }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState("");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.leaderboard ?? []);
        setWeek(data.week ?? "");
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.trophy}>🏆</span>
        <div>
          <h3 style={styles.title}>Weekly Leaderboard</h3>
          {week && <p style={styles.week}>{week}</p>}
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span style={{ color: "#886644", fontSize: "13px" }}>Loading...</span>
        </div>
      ) : entries.length === 0 ? (
        <p style={styles.empty}>No scores yet. Be the first!</p>
      ) : (
        <div style={styles.list}>
          {entries.slice(0, 10).map((entry) => {
            const isCurrentUser = entry.fid === currentFid;
            return (
              <div
                key={entry.fid}
                style={{
                  ...styles.row,
                  ...(isCurrentUser ? styles.currentRow : {}),
                  ...(entry.rank <= 3 ? styles.topRow : {}),
                }}
              >
                <span style={styles.rank}>{getRankIcon(entry.rank)}</span>
                <span style={styles.username}>
                  {entry.username}
                  {isCurrentUser && <span style={styles.youBadge}> YOU</span>}
                </span>
                <span style={styles.score}>{entry.score.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}

      {currentScore > 0 && !entries.find((e) => e.fid === currentFid) && (
        <div style={styles.yourScore}>
          <span>Your score: </span>
          <strong style={{ color: "#FFD700" }}>{currentScore.toLocaleString()}</strong>
          <span style={{ color: "#886644" }}> (not yet ranked)</span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "rgba(13, 10, 26, 0.9)",
    border: "1px solid rgba(255, 153, 0, 0.2)",
    borderRadius: "12px",
    padding: "16px",
    minWidth: "280px",
    maxWidth: "340px",
    width: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
    paddingBottom: "10px",
    borderBottom: "1px solid rgba(255,153,0,0.15)",
  },
  trophy: { fontSize: "24px" },
  title: {
    margin: 0,
    color: "#FFD700",
    fontSize: "15px",
    fontFamily: "'Courier New', monospace",
    fontWeight: "bold",
  },
  week: {
    margin: "2px 0 0",
    color: "#886644",
    fontSize: "11px",
    fontFamily: "'Courier New', monospace",
  },
  list: { display: "flex", flexDirection: "column", gap: "4px" },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 10px",
    borderRadius: "6px",
    background: "rgba(255,255,255,0.03)",
    transition: "background 0.2s",
  },
  topRow: {
    background: "rgba(255, 215, 0, 0.06)",
  },
  currentRow: {
    background: "rgba(255, 153, 0, 0.12)",
    border: "1px solid rgba(255, 153, 0, 0.3)",
  },
  rank: {
    fontFamily: "'Courier New', monospace",
    fontSize: "13px",
    color: "#886644",
    minWidth: "30px",
  },
  username: {
    flex: 1,
    fontFamily: "'Courier New', monospace",
    fontSize: "13px",
    color: "#e0c8a0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  youBadge: {
    fontSize: "9px",
    color: "#ff9900",
    background: "rgba(255,153,0,0.2)",
    padding: "1px 5px",
    borderRadius: "4px",
    marginLeft: "4px",
  },
  score: {
    fontFamily: "'Courier New', monospace",
    fontSize: "14px",
    color: "#FFD700",
    fontWeight: "bold",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "20px",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "2px solid rgba(255,153,0,0.2)",
    borderTop: "2px solid #ff9900",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  empty: {
    color: "#886644",
    fontFamily: "'Courier New', monospace",
    fontSize: "13px",
    textAlign: "center",
    padding: "16px 0",
  },
  yourScore: {
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,153,0,0.15)",
    fontFamily: "'Courier New', monospace",
    fontSize: "12px",
    color: "#c0a080",
    textAlign: "center",
  },
};
