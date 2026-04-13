"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GamePhase } from "@/types/game";

interface GameCanvasProps {
  fid: number;
  username: string;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  phase: GamePhase;
  onPhaseChange: (phase: GamePhase) => void;
}

export default function GameCanvas({
  fid,
  username,
  onGameOver,
  onScoreUpdate,
  phase,
  onPhaseChange,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startGame = useCallback(async () => {
    if (gameRef.current || !containerRef.current) return;

    const Phaser = (await import("phaser")).default;
    const { TempleRunScene } = await import("@/game/TempleRunScene");

    const scene = new TempleRunScene();

    const config: import("phaser").Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 600,
      height: 580,
      backgroundColor: "#0d0a1a",
      parent: containerRef.current,
      scene: [scene],
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameRef.current = new Phaser.Game(config);

    // Pass callbacks after scene starts
    gameRef.current.events.once("ready", () => {
      const s = gameRef.current!.scene.getScene("TempleRunScene") as TempleRunScene;
      s.scene.restart({
        onScoreUpdate,
        onGameOver: (score: number) => {
          onGameOver(score);
          onPhaseChange("dead");
        },
      });
      setIsReady(true);
    });
  }, [onGameOver, onScoreUpdate, onPhaseChange]);

  useEffect(() => {
    if (phase === "playing") {
      startGame();
    }

    return () => {
      if (phase === "idle" || phase === "dead") {
        gameRef.current?.destroy(true);
        gameRef.current = null;
        setIsReady(false);
      }
    };
  }, [phase, startGame]);

  const handleRestart = useCallback(async () => {
    if (gameRef.current) {
      const s = gameRef.current.scene.getScene("TempleRunScene") as import("@/game/TempleRunScene").TempleRunScene;
      s.scene.restart({
        onScoreUpdate,
        onGameOver: (score: number) => {
          onGameOver(score);
          onPhaseChange("dead");
        },
      });
      onPhaseChange("playing");
    } else {
      onPhaseChange("playing");
      setTimeout(startGame, 50);
    }
  }, [startGame, onGameOver, onScoreUpdate, onPhaseChange]);

  return (
    <div className="relative w-full flex items-center justify-center">
      <div
        ref={containerRef}
        id="game-container"
        style={{
          width: "600px",
          maxWidth: "100%",
          aspectRatio: "600 / 580",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(255, 153, 0, 0.3), 0 0 80px rgba(255, 100, 0, 0.15)",
          border: "2px solid rgba(255, 153, 0, 0.4)",
        }}
      />
    </div>
  );
}
