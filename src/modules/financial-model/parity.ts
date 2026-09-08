import type { CiudadDemo } from "../../types";
import { CASO_PARIDAD_MACHOTE } from "../../data/price-model-real";
import { calculateFinancialScenario, type FinancialModelParams, type FinancialScenarioInput } from "./index";

export interface ParityCase {
  id: string;
  nombre: string;
  fuente: string;
  input: FinancialScenarioInput;
  precioExcelMensual: number;
  toleranciaAbsoluta: number;
  notas: string;
}

export interface ParityResult {
  caso: ParityCase;
  precioModeloMensual: number;
  diferencia: number;
  diferenciaPct: number;
  pass: boolean;
}

// Caso control ya observado en PM MACHOTE 2026.
// El costo laboral usa el requerido total del Excel, no sólo la posición física.
export const PARITY_CASES: ParityCase[] = [
  {
    id: "machote-cdmx-guardia-12x5",
    nombre: "CDMX · Guardia · 12x5 · 1 posición",
    fuente: "PM_-_MACHOTE_2026_v1_2.xlsm / Resumen de Puestos + Precio Por Puesto",
    input: {
      ciudad: CASO_PARIDAD_MACHOTE.ciudad as CiudadDemo,
      salarioMensual: 13613.33,
      posiciones: 1,
      staffingFactor: CASO_PARIDAD_MACHOTE.requeridoTotal,
      uniformeMensual: 350,
      equipoMensual: 590,
      vehiculoMensual: 0,
      examenesMensual: 0,
      otrosDirectosMensual: 0,
    },
    precioExcelMensual: CASO_PARIDAD_MACHOTE.precioPorPuesto,
    toleranciaAbsoluta: 1,
    notas: "Control inicial. Incluye vacaciones + ausentismo del Resumen de Puestos. Debe llegar a ±$1 antes de considerar sustituida esta ruta Excel.",
  },
];

export function evaluateParity(caso: ParityCase, params: FinancialModelParams): ParityResult {
  const result = calculateFinancialScenario(caso.input, params);
  const precioModeloMensual = result.precio.mensualMxn;
  const diferencia = Math.round((precioModeloMensual - caso.precioExcelMensual) * 100) / 100;
  const diferenciaPct = caso.precioExcelMensual > 0 ? diferencia / caso.precioExcelMensual : 0;
  return {
    caso,
    precioModeloMensual,
    diferencia,
    diferenciaPct,
    pass: Math.abs(diferencia) <= caso.toleranciaAbsoluta,
  };
}

export function evaluateAllParity(params: FinancialModelParams): ParityResult[] {
  return PARITY_CASES.map((caso) => evaluateParity(caso, params));
}
