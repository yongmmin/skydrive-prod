"use client";

import Link from "next/link";
import { useState } from "react";
import AdSlot from "./components/AdSlot";

export default function LandingPage() {
  const [lang, setLang] = useState<"ko" | "en">("en");
  const t =
    lang === "ko"
      ? {
          badge: "아케이드 플라이트",
          title: "하늘을 가르고, 링을 모아라.",
          desc:
            "즉시 플레이 가능한 하늘 레이싱. 링 보너스를 챙기고 장애물을 피해서 최고 점수를 갱신하세요.",
          play: "플레이 시작",
          rank: "랭킹 보기"
        }
      : {
          badge: "Arcade Flight",
          title: "Cut Through The Sky.",
          desc:
            "Jump in instantly, collect ring bonuses, dodge hazards, and push your high score run after run.",
          play: "Start Flight",
          rank: "View Ranking"
        };

  return (
    <main className="flex min-h-screen flex-col bg-[#0b0d14] text-white">
      <div className="pointer-events-none fixed bottom-10 left-8 top-28 z-30 hidden 2xl:flex items-center">
        <div className="pointer-events-auto w-[150px]">
          <AdSlot label="Landing" placement="side" />
        </div>
      </div>
      <div className="pointer-events-none fixed bottom-10 right-8 top-28 z-30 hidden 2xl:flex items-center">
        <div className="pointer-events-auto w-[150px]">
          <AdSlot label="Landing" placement="side" />
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0d14]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="text-sm font-extrabold uppercase tracking-[0.35em] text-white/70">SkyDrive</span>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
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

      <div className="relative isolate flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
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

        <section className="relative">
          <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center gap-8 px-4 py-20 text-center sm:px-6">
            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.35em] text-white/70">
              {t.badge}
            </div>
            <h1 className="title text-3xl text-white sm:text-5xl">{t.title}</h1>
            <p className="max-w-2xl text-base text-white/70">
              {t.desc}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/play" className="rounded-full bg-white px-6 py-3 text-sm font-extrabold text-slate-900 shadow-soft transition hover:-translate-y-0.5">
                {t.play}
              </Link>
              <Link href="/rank" className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5">
                {t.rank}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
