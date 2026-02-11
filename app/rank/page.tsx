"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import AdSlot from "../components/AdSlot";
import type { LocalScoreRow } from "../../lib/localScores";

const podiumPlanes = [
  "/planes/plane-red.png",
  "/planes/plane-camo.png",
  "/planes/plane-black.png"
];
const confettiPieces = Array.from({ length: 34 }, (_, i) => ({
  left: `${4 + (i * 4.2) % 92}%`,
  delay: `${(i % 7) * 0.18}s`,
  duration: `${5.2 + (i % 6) * 0.65}s`,
  width: `${8 + (i % 4) * 3}px`,
  height: `${i % 2 === 0 ? 8 + (i % 4) * 3 : 6 + (i % 3) * 4}px`,
  rotate: `${(i * 29) % 360}deg`,
  color: ["#ffd14d", "#ff8a4d", "#7ce3ff", "#c6d2ff"][i % 4]
}));

type ServerScoreRow = {
  anon_id: string;
  score: number;
  created_at: string;
};

const demoRows: LocalScoreRow[] = [
  { anonId: "demo-001", score: 12840, createdAt: "2026-02-10T10:20:00.000Z" },
  { anonId: "demo-002", score: 12110, createdAt: "2026-02-10T09:40:00.000Z" },
  { anonId: "demo-003", score: 11680, createdAt: "2026-02-10T08:05:00.000Z" },
  { anonId: "demo-004", score: 11220, createdAt: "2026-02-09T21:13:00.000Z" },
  { anonId: "demo-005", score: 10970, createdAt: "2026-02-09T20:17:00.000Z" },
  { anonId: "demo-006", score: 10330, createdAt: "2026-02-09T18:10:00.000Z" },
  { anonId: "demo-007", score: 9870, createdAt: "2026-02-09T15:22:00.000Z" },
  { anonId: "demo-008", score: 9540, createdAt: "2026-02-09T14:00:00.000Z" },
  { anonId: "demo-009", score: 9230, createdAt: "2026-02-09T12:33:00.000Z" },
  { anonId: "demo-010", score: 9010, createdAt: "2026-02-09T11:11:00.000Z" }
];

export default function RankPage() {
  const [lang, setLang] = useState<"ko" | "en">("en");
  const [rows, setRows] = useState<LocalScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"server" | "demo">("demo");
  const [podiumAnimate, setPodiumAnimate] = useState(false);
  const t =
    lang === "ko"
      ? {
          heroEyebrow: "리더보드",
          heroTitle: "이번 주 상위 파일럿",
          scoreLabel: "점수",
          timeLabel: "기록",
          panelTitle: "실시간 랭킹",
          panelStatServer: "서버 공유 랭킹",
          panelStatDemo: "데모 랭킹",
          panelBtn: "기록 갱신하러 가기"
        }
      : {
          heroEyebrow: "Leaderboard",
          heroTitle: "Top Pilots This Week",
          scoreLabel: "Score",
          timeLabel: "Time",
          panelTitle: "Live Ranking",
          panelStatServer: "Shared server ranking",
          panelStatDemo: "Demo ranking",
          panelBtn: "Go Improve Your Run"
        };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/scores", { cache: "no-store" });
        if (!res.ok) throw new Error("server_unavailable");
        const data = (await res.json()) as ServerScoreRow[];
        if (!mounted) return;
        setRows(
          data.map((row) => ({
            anonId: row.anon_id,
            score: row.score,
            createdAt: row.created_at
          }))
        );
        setSource("server");
      } catch {
        if (!mounted) return;
        setRows([]);
        setSource("demo");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setPodiumAnimate(true), 120);
    return () => window.clearTimeout(t);
  }, [rows.length]);

  const visibleRows = useMemo(() => (rows.length > 0 ? rows : demoRows), [rows]);
  const topThree = useMemo(() => visibleRows.slice(0, 3), [visibleRows]);
  const rankRows = useMemo(() => visibleRows.slice(0, 10), [visibleRows]);
  const toPilotName = (anonId: string, rank: number) =>
    `Pilot-${anonId.replace(/-/g, "").slice(0, 4).toUpperCase() || String(rank).padStart(2, "0")}`;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === "ko" ? "ko-KR" : "en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <main className="min-h-screen bg-[#0b0d14] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0d14]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-sm font-extrabold uppercase tracking-[0.35em] text-white/70">SkyDrive</span>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/20 bg-white/10 p-1">
              <button
                onClick={() => setLang("ko")}
                className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition ${lang === "ko" ? "bg-white text-slate-900" : "text-white/80"}`}
              >
                한글
              </button>
              <button
                onClick={() => setLang("en")}
                className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition ${lang === "en" ? "bg-white text-slate-900" : "text-white/80"}`}
              >
                ENG
              </button>
            </div>
            <Link href="/" className="rounded-full bg-white px-5 py-2 text-xs font-extrabold text-slate-900 shadow-soft hover:-translate-y-0.5 transition">
              Home
            </Link>
            <Link href="/rank" className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-xs font-bold text-white shadow-soft hover:-translate-y-0.5 transition">
              Rank
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[160px]" />
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute right-0 bottom-10 h-72 w-72 rounded-full bg-pink-400/12 blur-3xl" />
          <div
            className="absolute inset-0 opacity-12"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "120px 120px"
            }}
          />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-white/60">{t.heroEyebrow}</p>
            <h1 className="title text-4xl text-white">{t.heroTitle}</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[28px] border border-white/20 bg-gradient-to-b from-[#1f3556]/80 to-[#172437]/70 p-4 shadow-soft backdrop-blur">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-cyan-100/75">{t.panelTitle}</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="text-lg font-black text-white">{source === "server" ? t.panelStatServer : t.panelStatDemo}</div>
                  <Link
                    href="/play"
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-900 shadow-soft transition hover:-translate-y-0.5"
                  >
                    {t.panelBtn}
                  </Link>
                </div>
                <div className="mt-1 text-sm text-white/60">{loading ? "..." : `${rankRows.length} records`}</div>
              </div>
              <div className="mt-3 max-h-[430px] space-y-2 overflow-y-auto pr-1">
                {rankRows.map((p, i) => (
                  <div
                    key={`${p.anonId}-${p.createdAt}-${i}`}
                    className="flex items-center justify-between rounded-2xl border border-white/15 bg-[#123057]/55 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 text-center text-base font-black ${
                          i === 0 ? "text-yellow-300" : i === 1 ? "text-slate-200" : i === 2 ? "text-orange-300" : "text-white/80"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="text-base font-bold text-white">{toPilotName(p.anonId, i + 1)}</div>
                    </div>
                    <div className="text-sm font-extrabold text-white/90">{p.score.toLocaleString("en-US")}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-br from-[#6dd2ff]/35 via-[#4eaef2]/30 to-[#2d6eb9]/35 p-6 shadow-soft backdrop-blur">
              <div className="pointer-events-none absolute -left-10 top-8 h-20 w-28 rounded-full bg-white/35 blur-xl" />
              <div className="pointer-events-none absolute right-6 top-14 h-16 w-24 rounded-full bg-white/30 blur-xl" />
              <div className="pointer-events-none absolute -right-8 bottom-12 h-24 w-28 rounded-full bg-cyan-100/25 blur-xl" />
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-20 overflow-hidden">
                <div className="spotlight spotlight-a" />
                <div className="spotlight spotlight-b" />
                <div className="spotlight spotlight-c" />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40">
                <div className="absolute inset-x-0 bottom-16 h-16 bg-[linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:26px_26px] opacity-20" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0d1f33]/80 via-[#122944]/55 to-transparent" />
                <div className="absolute inset-x-0 bottom-2 h-14 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25),transparent_70%)] opacity-40" />
                <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 px-2">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={`crowd-${i}`}
                      className="rounded-t-full bg-[#091526]/85"
                      style={{
                        width: `${18 + (i % 4) * 6}px`,
                        height: `${20 + (i % 5) * 7}px`
                      }}
                    />
                  ))}
                </div>
                <div className="absolute left-[10%] bottom-16 flag flag-a" />
                <div className="absolute left-[34%] bottom-16 flag flag-b" />
                <div className="absolute left-[68%] bottom-16 flag flag-c" />
              </div>
              <div className="pointer-events-none absolute inset-0">
                {confettiPieces.map((piece, idx) => (
                  <span
                    key={`confetti-${idx}`}
                    className="confetti"
                    style={{
                      left: piece.left,
                      animationDelay: piece.delay,
                      animationDuration: piece.duration,
                      width: piece.width,
                      height: piece.height,
                      transform: `rotate(${piece.rotate})`,
                      backgroundColor: piece.color
                    }}
                  />
                ))}
              </div>
              <div className="pointer-events-none absolute bottom-16 left-8 right-8 h-8 rounded-full bg-[#1f3f60]/40 blur-md" />
              <div className="relative flex items-end justify-center gap-4 pt-3">
                {[1, 0, 2].map((slot) => {
                  const p = topThree[slot];
                  const targetHeight = slot === 0 ? 300 : slot === 1 ? 230 : 190;
                  const delay = slot === 2 ? 0 : slot === 1 ? 260 : 520; // 3rd -> 2nd -> 1st
                  const podiumBase = slot === 0 ? "bg-[#f3b82b]" : slot === 1 ? "bg-[#a9b4c8]" : "bg-[#de8749]";
                  if (!p) return null;
                  return (
                    <div key={`${p.anonId}-${p.createdAt}-${slot}`} className="flex w-[31%] flex-col items-center">
                      <div className={`relative mb-2 ${slot === 0 ? "w-40" : "w-32"}`}>
                        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45),transparent_70%)] blur-sm" />
                        <Image
                          src={podiumPlanes[slot] ?? podiumPlanes[0]}
                          alt="podium plane"
                          width={220}
                          height={120}
                          className="relative h-28 w-full object-contain brightness-125 contrast-130 drop-shadow-[0_16px_16px_rgba(0,0,0,0.58)]"
                        />
                      </div>
                      <div className="relative w-full" style={{ height: `${targetHeight}px` }}>
                        <div
                          className={`absolute inset-0 origin-bottom rounded-t-2xl border border-black/10 px-2 pt-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${podiumBase} overflow-hidden`}
                          style={{
                            transform: podiumAnimate ? "scaleY(1)" : "scaleY(0)",
                            transitionProperty: "transform",
                            transitionDuration: "760ms",
                            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                            transitionDelay: `${delay}ms`
                          }}
                        >
                          <div
                            className="absolute inset-0 opacity-25"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0, rgba(255,255,255,0.18) 8px, transparent 8px, transparent 16px)"
                            }}
                          />
                          <div className="relative text-sm font-black tracking-[0.24em] text-slate-900">#{slot + 1}</div>
                          <div className="relative mt-2 text-lg font-black text-slate-950">{p.score.toLocaleString("en-US")}</div>
                          <div className="relative mt-1 truncate text-xs font-extrabold text-slate-900/90">{toPilotName(p.anonId, slot + 1)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="relative mt-4 flex justify-center">
                <div className="h-4 w-full max-w-xs rounded-full bg-white/20 blur-[1px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-16">
        <AdSlot label="Rank" />
      </div>
      <style jsx>{`
        .spotlight {
          position: absolute;
          bottom: -20%;
          width: 24%;
          height: 120%;
          background: linear-gradient(to top, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
          filter: blur(2px);
          transform-origin: bottom center;
          opacity: 0.28;
        }
        .spotlight-a {
          left: 8%;
          animation: sweepA 5s ease-in-out infinite;
        }
        .spotlight-b {
          left: 38%;
          animation: sweepB 6s ease-in-out infinite;
        }
        .spotlight-c {
          left: 68%;
          animation: sweepC 5.6s ease-in-out infinite;
        }
        .flag {
          width: 22px;
          height: 26px;
          border-left: 2px solid rgba(255, 255, 255, 0.7);
          transform-origin: bottom center;
        }
        .flag::after {
          content: "";
          position: absolute;
          top: 1px;
          left: 2px;
          width: 16px;
          height: 10px;
          border-radius: 2px;
          background: linear-gradient(90deg, #ffd76a, #ff8e5e);
          box-shadow: 0 0 6px rgba(255, 200, 90, 0.6);
        }
        .flag-a {
          animation: wave 2.4s ease-in-out infinite;
        }
        .flag-b {
          animation: wave 2s ease-in-out infinite 0.25s;
        }
        .flag-c {
          animation: wave 2.6s ease-in-out infinite 0.4s;
        }
        .confetti {
          position: absolute;
          top: -12px;
          border-radius: 1px;
          opacity: 0.88;
          animation-name: confettiFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes sweepA {
          0%,
          100% { transform: translateX(-8px) rotate(-7deg); }
          50% { transform: translateX(12px) rotate(5deg); }
        }
        @keyframes sweepB {
          0%,
          100% { transform: translateX(10px) rotate(4deg); }
          50% { transform: translateX(-10px) rotate(-6deg); }
        }
        @keyframes sweepC {
          0%,
          100% { transform: translateX(-9px) rotate(-5deg); }
          50% { transform: translateX(8px) rotate(7deg); }
        }
        @keyframes wave {
          0%,
          100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(620px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}
