import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Score, User } from "@/lib/models";

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = Math.round(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const { fid, score, username } = await req.json();
    if (!fid || score === undefined || !username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await connectDB();
    if (!db) {
      // DB not configured – still return success for local dev
      return NextResponse.json({ success: true, score, message: "Score recorded (no DB)" });
    }

    const week = getWeekKey(new Date());

    // Upsert user
    await User.findOneAndUpdate(
      { fid },
      { fid, username },
      { upsert: true, new: true }
    );

    // Save score
    await Score.create({ fid, username, score, week });

    return NextResponse.json({ success: true, score });
  } catch (err) {
    console.error("POST /api/score error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
