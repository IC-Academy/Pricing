import type { PuestoCotizado } from "../../types";

export const HORAS_ESQUEMA_BASE = 72;

export interface DimensionamientoPuesto {
  horasSemana:number;
  posiciones:number;
  hcExacto:number;
  hcRequerido:number;
}

/**
 * Dimensionamiento operativo acordado con Pricing:
 * horas por turno × días por semana × posiciones / esquema base de 72 h.
 * El resultado operativo se redondea hacia arriba porque no se puede cubrir con fracciones de persona.
 */
export function calcularHcRequeridoPuesto(puesto:PuestoCotizado):DimensionamientoPuesto {
  const horasSemana=Math.max(0,puesto.horas)*Math.max(0,Math.min(puesto.dias,7));
  const posiciones=Math.max(1,Math.round(puesto.cantidadPosiciones));
  const hcExacto=(horasSemana*posiciones)/HORAS_ESQUEMA_BASE;
  const hcRequerido=Math.max(posiciones,Math.ceil(hcExacto));
  return {horasSemana,posiciones,hcExacto,hcRequerido};
}

export function calcularHcRequeridoTotal(puestos:PuestoCotizado[]):number {
  return puestos.reduce((total,p)=>total+calcularHcRequeridoPuesto(p).hcRequerido,0);
}
