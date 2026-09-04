import type { VigenciaEstado } from "../../types";

const STYLES: Record<VigenciaEstado, { label: string; className: string; dot: string }> = {
  VIGENTE: { label: "Vigente", className: "bg-success-50 text-success-600", dot: "bg-success-500" },
  PROXIMO_A_VENCER: { label: "Próximo a vencer", className: "bg-warning-50 text-warning-600", dot: "bg-warning-500" },
  VENCIDO: { label: "Vencido", className: "bg-danger-50 text-danger-600", dot: "bg-danger-500" },
  SIN_VIGENCIA: { label: "Sin vigencia", className: "bg-ink-100 text-ink-600", dot: "bg-ink-400" },
};

export function VigenciaBadge({ estado }: { estado: VigenciaEstado }) {
  const s = STYLES[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
