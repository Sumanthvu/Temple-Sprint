import type { Metadata } from "next";
import { Web3Provider } from "@/components/Web3Provider";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://temple-sprint.vercel.app";

export const metadata: Metadata = {
  title: "Temple Sprint | Farcaster Endless Runner",
  description:
    "A Temple Run-style endless runner playable inside Farcaster. Run, dodge, share your score, and earn on-chain badges on Sepolia!",
  openGraph: {
    title: "Temple Sprint",
    description: "Run the temple. Beat the leaderboard. Earn on-chain badges.",
    url: APP_URL,
    siteName: "Temple Sprint",
    images: [{ url: `${APP_URL}/og.png`, width: 1200, height: 630 }],
    type: "website",
  },
  // Farcaster Frame v2 metadata
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${APP_URL}/og.png`,
      button: {
        title: "🏃 Play Temple Sprint",
        action: {
          type: "launch_frame",
          name: "Temple Sprint",
          url: APP_URL,
          splashImageUrl: `${APP_URL}/splash.png`,
          splashBackgroundColor: "#0d0a1a",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: "#05030d", color: "#e0c8a0" }}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
