import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Score } from "@/lib/models";

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = Math.round(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ leaderboard: [], message: "No DB configured" });
    }

    const week = getWeekKey(new Date());

    // Get top 50 scores for current week, best score per user
    const leaderboard = await Score.aggregate([
      { $match: { week } },
      { $sort: { score: -1 } },
      {
        $group: {
          _id: "$fid",
          username: { $first: "$username" },
          score: { $max: "$score" },
          fid: { $first: "$fid" },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 50 },
      {
        $project: {
          _id: 0,
          fid: 1,
          username: 1,
          score: 1,
        },
      },
    ]);

    const ranked = leaderboard.map((entry, i) => ({ ...entry, rank: i + 1 }));

    return NextResponse.json({ leaderboard: ranked, week });
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
