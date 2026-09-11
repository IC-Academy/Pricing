import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/80 bg-white/95 shadow-[0_12px_34px_rgba(13,31,55,.07)] ring-1 ring-ink-200/60 ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title:string; subtitle?:string; action?:ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 md:px-6">
      <div>
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-brand-800">{title}</h2>
        {subtitle && <p className="mt-1 text-xs leading-5 text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label,value,hint,tone="neutral" }:{label:string;value:string|number;hint?:string;tone?:"neutral"|"brand"|"warning"|"danger"|"success"}) {
  const toneClass:Record<string,string>={neutral:"text-ink-900",brand:"text-brand-600",warning:"text-warning-600",danger:"text-danger-600",success:"text-success-600"};
  return (
    <Card className="relative overflow-hidden px-5 py-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500"/>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.03em] ${toneClass[tone]}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-5 text-ink-500">{hint}</p>}
    </Card>
  );
}
