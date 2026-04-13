"use client";

import { useState, useEffect, useCallback } from "react";
import sdk from "@farcaster/frame-sdk";
import { FarcasterContext } from "@/types/game";

const GUEST_CONTEXT: FarcasterContext = { fid: 0, username: "Guest" };

export function useFarcaster() {
  const [context, setContext] = useState<FarcasterContext>(GUEST_CONTEXT);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFarcaster, setIsFarcaster] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const ctx = await sdk.context;
        if (ctx?.user && mounted) {
          setContext({
            fid: ctx.user.fid,
            username: ctx.user.username ?? `fid:${ctx.user.fid}`,
            displayName: ctx.user.displayName ?? undefined,
            pfpUrl: ctx.user.pfpUrl ?? undefined,
          });
          setIsFarcaster(true);
        }
        // Signal to Farcaster that the app is ready
        await sdk.actions.ready();
      } catch {
        // Running outside Farcaster (browser dev) — use guest
      } finally {
        if (mounted) setIsLoaded(true);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const shareScore = useCallback(
    async (score: number, appUrl: string) => {
      const text = `🏃 I just scored ${score} in Temple Sprint! Can you beat me? Play now 👇`;
      const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(appUrl)}`;
      try {
        if (isFarcaster) {
          await sdk.actions.openUrl(castUrl);
        } else {
          window.open(castUrl, "_blank");
        }
      } catch {
        window.open(castUrl, "_blank");
      }
    },
    [isFarcaster]
  );

  return { context, isLoaded, isFarcaster, shareScore };
}
