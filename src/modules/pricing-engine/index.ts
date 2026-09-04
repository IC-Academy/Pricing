// ============================================================================
// pricing-engine
// ----------------------------------------------------------------------------
// THIS IS THE MODULE TO REPLACE when the real Excel-based pricing rules are
// ready. Every formula in this file is a DEMO simplification meant to prove
// out the architecture, UX and validation flow — not the real business
// logic. Nothing outside this file (no UI component) should ever compute a
// cost or a price; they all call into `calcularCotizacion` below.
//
// Demo formula:
//   costoLaboralMensual = salarioMensual * (1 + CARGA_SOCIAL_PCT)
//   costoMensualTotal   = costoLaboralMensual + uniforme + equipo + vehiculo
//                         (all amortized to a monthly figure)
//                         then + overhead (OVERHEAD_PCT of the subtotal)
//   precioRecomendado   = costoMensualTotal / (1 - margenObjetivo)
//
// To swap in the real Excel formulas later: implement a new function with
// the same signature as `calcularCotizacion` (ResultadoCalculo out), point
// the call site in src/ui/pages/calculadora at it, and delete/replace the
// constants below. Nothing else needs to change.
// ============================================================================

import type { ParametrosComerciales, PuestoCalculado, PuestoCotizado, ResultadoCalculo } from "../../types";

/** Carga social (IMSS, INFONAVIT, aguinaldo, vacaciones, etc.) as % of salary. Demo constant. */
export const CARGA_SOCIAL_PCT = 0.42;

/** Overhead (administración, supervisión, utilidad operativa) as % of the labor+goods subtotal. Demo constant. */
export const OVERHEAD_PCT = 0.08;

export function calcularCostoLaboralMensual(salarioMensual: number): number {
  return round2(salarioMensual * (1 + CARGA_SOCIAL_PCT));
}

export function calcularPuesto(puesto: PuestoCotizado, margenObjetivo: number): PuestoCalculado {
  const costoLaboralMensual = calcularCostoLaboralMensual(puesto.salarioMensual);
  const bienesMensual = puesto.uniformeCosto + puesto.equipoCosto + (puesto.vehiculoOpcional ? puesto.vehiculoCosto : 0);
  const subtotal = costoLaboralMensual + bienesMensual;
  const overhead = round2(subtotal * OVERHEAD_PCT);
  const costoMensualPorPosicion = round2(subtotal + overhead);
  const costoMensualTotal = round2(costoMensualPorPosicion * puesto.cantidadPosiciones);

  const margenSeguro = clampMargen(margenObjetivo);
  const precioRecomendadoUnitario = round2(costoMensualPorPosicion / (1 - margenSeguro));
  const precioTotalPuesto = round2(precioRecomendadoUnitario * puesto.cantidadPosiciones);

  return {
    ...puesto,
    costoLaboralMensual,
    costoMensualTotal,
    precioRecomendadoUnitario,
    precioTotalPuesto,
  };
}

export function calcularCotizacion(
  puestos: PuestoCotizado[],
  parametrosComerciales: ParametrosComerciales
): ResultadoCalculo {
  const puestosCalculados = puestos.map((p) => calcularPuesto(p, parametrosComerciales.grossMarginObjetivo));
  const costoMensualTotal = round2(puestosCalculados.reduce((acc, p) => acc + p.costoMensualTotal, 0));
  const precioMensualTotal = round2(puestosCalculados.reduce((acc, p) => acc + p.precioTotalPuesto, 0));

  return {
    puestos: puestosCalculados,
    costoMensualTotal,
    precioMensualTotal,
    margenAplicado: clampMargen(parametrosComerciales.grossMarginObjetivo),
  };
}

function clampMargen(margen: number): number {
  if (Number.isNaN(margen)) return 0.2;
  return Math.min(Math.max(margen, 0), 0.85);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
