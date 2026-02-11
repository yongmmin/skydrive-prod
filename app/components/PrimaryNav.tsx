import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "/play", label: "Play" },
  { href: "/rank", label: "Rank" }
];

export default function PrimaryNav() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] border border-white/70 bg-white/85 px-6 py-4 shadow-soft backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-white/70 bg-white p-2">
          <Image src="/mascot.png" alt="Mascot" width={36} height={36} className="rounded-xl" />
        </div>
        <div className="flex flex-col">
          <span className="badge">Nexus Rush</span>
          <span className="title text-xl text-slate-800">Minion Mayhem</span>
        </div>
      </div>
      <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-transparent px-4 py-2 transition hover:border-white/70 hover:bg-white"
          >
            {link.label}
          </Link>
        ))}
        <Link href="/play" className="coastal-button">
          Play Now
        </Link>
      </nav>
    </header>
  );
}
