// ============================================================================
// pricing-engine — Demo V0.5
// Mantiene compatibilidad con las pruebas existentes, pero expone el costo
// laboral como Gross Comp (no sólo sueldo) y agrega mensual/anual + MXN/USD.
// La paridad fina contra el MACHOTE seguirá sustituyendo componentes internos.
// ============================================================================

import type { DatosGenerales, DesgloseCostoLaboral, ParametrosComerciales, PuestoCalculado, PuestoCotizado, ResultadoCalculo } from "../../types";
import { ISN_2026, PARAMETROS_LABORALES_2026 } from "../../data/price-model-real";

export const CARGA_SOCIAL_PCT = 0.42;
export const OVERHEAD_PCT = 0.08;

function round2(n:number):number { return Math.round(n * 100) / 100; }
function clampMargen(margen:number):number {
  if (Number.isNaN(margen)) return 0.2;
  return Math.min(Math.max(margen,0),0.85);
}

export function calcularDesgloseLaboral(salarioMensual:number, datosGenerales?:DatosGenerales):DesgloseCostoLaboral {
  const aguinaldoMensualizado = round2((salarioMensual / 30) * PARAMETROS_LABORALES_2026.aguinaldoDias / 12);
  const vacacionesMensualizadas = round2((salarioMensual / 30) * PARAMETROS_LABORALES_2026.vacacionesDias / 12);
  const primaVacacionalMensualizada = round2(vacacionesMensualizadas * PARAMETROS_LABORALES_2026.primaVacacionalPct);
  const isnPct = datosGenerales ? (ISN_2026[datosGenerales.estado] ?? ISN_2026[datosGenerales.ciudad] ?? 0) : 0;
  const isn = round2(salarioMensual * isnPct);
  const riesgoTrabajo = round2(salarioMensual * PARAMETROS_LABORALES_2026.riesgoTrabajoB07Pct);

  // El total de carga social se conserva en 42% mientras terminamos la paridad
  // de todas las ramas IMSS/INFONAVIT del Gross Comp. El residual representa
  // esas cargas aún no desglosadas individualmente en la demo.
  const cargaObjetivo = round2(salarioMensual * CARGA_SOCIAL_PCT);
  const componentesConocidos = aguinaldoMensualizado + vacacionesMensualizadas + primaVacacionalMensualizada + isn + riesgoTrabajo;
  const cargaSocialReferencia = round2(Math.max(0, cargaObjetivo - componentesConocidos));
  const costoLaboralTotal = round2(salarioMensual + cargaObjetivo);

  return {
    sueldoBaseMensual:salarioMensual,
    aguinaldoMensualizado,
    vacacionesMensualizadas,
    primaVacacionalMensualizada,
    cargaSocialReferencia,
    isn,
    riesgoTrabajo,
    costoLaboralTotal,
  };
}

export function calcularCostoLaboralMensual(salarioMensual:number):number {
  return round2(salarioMensual * (1 + CARGA_SOCIAL_PCT));
}

export function calcularPuesto(puesto:PuestoCotizado, margenObjetivo:number, datosGenerales?:DatosGenerales):PuestoCalculado {
  const desgloseLaboral = calcularDesgloseLaboral(puesto.salarioMensual, datosGenerales);
  const costoLaboralMensual = desgloseLaboral.costoLaboralTotal;
  const bienesMensual = puesto.uniformeCosto + puesto.equipoCosto + (puesto.vehiculoOpcional ? puesto.vehiculoCosto : 0) + (puesto.costoExamenesMensualizado ?? 0);
  const subtotal = costoLaboralMensual + bienesMensual;
  const overhead = round2(subtotal * OVERHEAD_PCT);
  const costoMensualPorPosicion = round2(subtotal + overhead);
  const costoMensualTotal = round2(costoMensualPorPosicion * puesto.cantidadPosiciones);
  const costoAnualTotal = round2(costoMensualTotal * 12);

  const margenSeguro = clampMargen(margenObjetivo);
  const precioRecomendadoUnitario = round2(costoMensualPorPosicion / (1 - margenSeguro));
  const precioTotalPuesto = round2(precioRecomendadoUnitario * puesto.cantidadPosiciones);
  const precioAnualPuesto = round2(precioTotalPuesto * 12);

  return { ...puesto, costoLaboralMensual, desgloseLaboral, costoMensualTotal, costoAnualTotal, precioRecomendadoUnitario, precioTotalPuesto, precioAnualPuesto };
}

export function calcularCotizacion(puestos:PuestoCotizado[], parametrosComerciales:ParametrosComerciales, datosGenerales?:DatosGenerales):ResultadoCalculo {
  const puestosCalculados = puestos.map((p) => calcularPuesto(p, parametrosComerciales.grossMarginObjetivo, datosGenerales));
  const costoMensualTotal = round2(puestosCalculados.reduce((acc,p) => acc + p.costoMensualTotal,0));
  const precioMensualTotal = round2(puestosCalculados.reduce((acc,p) => acc + p.precioTotalPuesto,0));
  const costoAnualTotal = round2(costoMensualTotal * 12);
  const precioAnualTotal = round2(precioMensualTotal * 12);
  const fx = parametrosComerciales.tipoCambioUsdMxn && parametrosComerciales.tipoCambioUsdMxn > 0 ? parametrosComerciales.tipoCambioUsdMxn : undefined;

  return {
    puestos:puestosCalculados,
    costoMensualTotal,
    costoAnualTotal,
    precioMensualTotal,
    precioAnualTotal,
    precioMensualUsd:fx ? round2(precioMensualTotal / fx) : undefined,
    precioAnualUsd:fx ? round2(precioAnualTotal / fx) : undefined,
    margenAplicado:clampMargen(parametrosComerciales.grossMarginObjetivo),
  };
}
