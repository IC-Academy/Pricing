import type { ExceptionStatus, QuotationStatus } from "../../types";

const QUOTATION_STYLES: Record<QuotationStatus, { label: string; className: string }> = {
  BORRADOR: { label: "Borrador", className: "bg-ink-100 text-ink-700" },
  CALCULADA: { label: "Calculada", className: "bg-brand-50 text-brand-700" },
  PENDIENTE_VALIDACION: { label: "Pendiente de validación", className: "bg-warning-50 text-warning-600" },
  VALIDADA: { label: "Validada", className: "bg-success-50 text-success-600" },
  PROPUESTA_GENERADA: { label: "Propuesta generada", className: "bg-brand-100 text-brand-800" },
  CANCELADA: { label: "Cancelada", className: "bg-danger-50 text-danger-600" },
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const s = QUOTATION_STYLES[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${s.className}`}>{s.label}</span>;
}

const EXCEPTION_STYLES: Record<ExceptionStatus, { label: string; className: string }> = {
  PENDIENTE: { label: "Pendiente", className: "bg-warning-50 text-warning-600" },
  ACEPTADA: { label: "Aceptada", className: "bg-success-50 text-success-600" },
  RECHAZADA: { label: "Rechazada", className: "bg-danger-50 text-danger-600" },
  AJUSTE_SOLICITADO: { label: "Ajuste solicitado", className: "bg-brand-50 text-brand-700" },
  CONVERTIDA_A_PARAMETRO: { label: "Convertida a parámetro", className: "bg-brand-100 text-brand-800" },
};

export function ExceptionStatusBadge({ status }: { status: ExceptionStatus }) {
  const s = EXCEPTION_STYLES[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${s.className}`}>{s.label}</span>;
}
