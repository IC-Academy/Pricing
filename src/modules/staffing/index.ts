import type { PuestoCotizado } from "../../types";

export const HORAS_ESQUEMA_BASE = 72;

export interface DimensionamientoPuesto {
  horasSemana:number;
  posiciones:number;
  esquemaHoras:number;
  hcExacto:number;
  hcBase:number;
  contingenciaPct:number;
  hcContingencia:number;
  hcTotal:number;
  /** Compatibilidad con el resto del motor: equivale al HC total costado. */
  hcRequerido:number;
}

/**
 * Dimensionamiento operativo:
 * horas por turno × días por semana × posiciones / esquema laboral capturado.
 * El esquema puede ser 72, 40, 25, 10.5, etc. según el servicio.
 * La contingencia queda parametrizada manualmente hasta cerrar la fórmula oficial del MACHOTE.
 */
export function calcularHcRequeridoPuesto(puesto:PuestoCotizado):DimensionamientoPuesto {
  const horasSemana=Math.max(0,puesto.horas)*Math.max(0,Math.min(puesto.dias,7));
  const posiciones=Math.max(1,Math.round(puesto.cantidadPosiciones));
  const esquemaHoras=Math.max(0.5,Number(puesto.esquemaHoras ?? HORAS_ESQUEMA_BASE));
  const hcExacto=(horasSemana*posiciones)/esquemaHoras;
  const hcBase=Math.max(posiciones,Math.ceil(hcExacto));
  const contingenciaPct=Math.max(0,Number(puesto.contingenciaPct ?? 0));
  const hcContingencia=contingenciaPct>0?Math.ceil(hcBase*contingenciaPct):0;
  const hcTotal=hcBase+hcContingencia;
  return {horasSemana,posiciones,esquemaHoras,hcExacto,hcBase,contingenciaPct,hcContingencia,hcTotal,hcRequerido:hcTotal};
}

export function calcularHcRequeridoTotal(puestos:PuestoCotizado[]):number {
  return puestos.reduce((total,p)=>total+calcularHcRequeridoPuesto(p).hcTotal,0);
}
