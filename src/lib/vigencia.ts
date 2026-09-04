// ============================================================================
// Shared vigencia (validity) calculation — used by catalog-service and by
// the Benchmark module, which both track fechaVencimiento / alert lead time.
// ============================================================================

export type VigenciaEstado = "VIGENTE" | "PROXIMO_A_VENCER" | "VENCIDO" | "SIN_VIGENCIA";

export interface VigenciaAware {
  fechaVencimiento: string;
  diasAnticipacionAlerta: number;
  activo: boolean;
}

export function computeVigenciaEstado(entity: VigenciaAware, today: Date = new Date()): VigenciaEstado {
  if (!entity.activo || !entity.fechaVencimiento) return "SIN_VIGENCIA";

  const vencimiento = new Date(entity.fechaVencimiento);
  const alertaDesde = new Date(vencimiento);
  alertaDesde.setDate(alertaDesde.getDate() - (entity.diasAnticipacionAlerta || 0));

  if (today.getTime() > vencimiento.getTime()) return "VENCIDO";
  if (today.getTime() >= alertaDesde.getTime()) return "PROXIMO_A_VENCER";
  return "VIGENTE";
}
