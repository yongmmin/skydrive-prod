import PrimaryNav from "./PrimaryNav";

type PageShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <main className="main-shell">
      <PrimaryNav />
      <section className="section-card">
        <p className="text-xs font-extrabold uppercase tracking-[0.35em] text-slate-500">
          {subtitle}
        </p>
        <h2 className="mt-3 text-3xl text-slate-800">{title}</h2>
        <div className="mt-6 grid gap-6">{children}</div>
      </section>
    </main>
  );
}
