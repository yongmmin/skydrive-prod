import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

const TABLE = "scores";
const MAX_SCORE = 50000; // basic abuse guard

export async function GET() {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const { data, error } = await supabaseServer
    .from(TABLE)
    .select("anon_id, score, created_at")
    .order("score", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const anonId = body?.anonId as string;
  const score = Number(body?.score);
  if (!anonId || !Number.isFinite(score)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (score < 0 || score > MAX_SCORE) {
    return NextResponse.json({ error: "Score out of range" }, { status: 400 });
  }

  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { error } = await supabaseServer.from(TABLE).insert({ anon_id: anonId, score });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
