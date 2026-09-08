// ============================================================================
// pricing-engine — V0.6 puente hacia el modelo real
// Los parámetros administrados en Modelo Pricing ya alimentan nuevas cotizaciones.
// Se conserva compatibilidad con las pruebas y defaults actuales mientras se
// termina la paridad fina de Gross Comp / Estructura de Costos / Cash Flow.
// ============================================================================

import type { DatosGenerales, DesgloseCostoLaboral, ParametrosComerciales, PuestoCalculado, PuestoCotizado, ResultadoCalculo } from "../../types";
import { ISN_2026, PARAMETROS_LABORALES_2026 } from "../../data/price-model-real";
import { DEFAULT_FINANCIAL_MODEL_PARAMS, loadFinancialModelParams, type FinancialModelParams } from "../financial-model";

export const CARGA_SOCIAL_PCT = 0.42;
export const OVERHEAD_PCT = 0.08;

function round2(n:number):number { return Math.round(n * 100) / 100; }
function clampMargen(margen:number):number {
  if (Number.isNaN(margen)) return 0.2;
  return Math.min(Math.max(margen,0),0.85);
}

function modelParams():FinancialModelParams {
  try { return loadFinancialModelParams(); } catch { return { ...DEFAULT_FINANCIAL_MODEL_PARAMS }; }
}

export function calcularDesgloseLaboral(salarioMensual:number, datosGenerales?:DatosGenerales, params:FinancialModelParams = modelParams()):DesgloseCostoLaboral {
  const aguinaldoMensualizado = round2((salarioMensual / 30) * PARAMETROS_LABORALES_2026.aguinaldoDias / 12);
  const vacacionesMensualizadas = round2((salarioMensual / 30) * PARAMETROS_LABORALES_2026.vacacionesDias / 12);
  const primaVacacionalMensualizada = round2(vacacionesMensualizadas * PARAMETROS_LABORALES_2026.primaVacacionalPct);
  const isnPct = datosGenerales ? (ISN_2026[datosGenerales.estado] ?? ISN_2026[datosGenerales.ciudad] ?? 0) : 0;
  const isn = round2(salarioMensual * isnPct);
  const riesgoTrabajo = round2(salarioMensual * PARAMETROS_LABORALES_2026.riesgoTrabajoB07Pct);
  const cargaObjetivo = round2(salarioMensual * Math.max(0,params.cargaSocialPct));
  const componentesConocidos = aguinaldoMensualizado + vacacionesMensualizadas + primaVacacionalMensualizada + isn + riesgoTrabajo;
  const cargaSocialReferencia = round2(Math.max(0, cargaObjetivo - componentesConocidos));
  const costoLaboralTotal = round2(salarioMensual + cargaObjetivo);

  return { sueldoBaseMensual:salarioMensual, aguinaldoMensualizado, vacacionesMensualizadas, primaVacacionalMensualizada, cargaSocialReferencia, isn, riesgoTrabajo, costoLaboralTotal };
}

// Se conserva como función estable para pruebas y consumidores existentes.
export function calcularCostoLaboralMensual(salarioMensual:number):number {
  return round2(salarioMensual * (1 + CARGA_SOCIAL_PCT));
}

export function calcularPuesto(puesto:PuestoCotizado, margenObjetivo:number, datosGenerales?:DatosGenerales, params:FinancialModelParams = modelParams()):PuestoCalculado {
  const desgloseLaboral = calcularDesgloseLaboral(puesto.salarioMensual, datosGenerales, params);
  const costoLaboralMensual = desgloseLaboral.costoLaboralTotal;
  const bienesMensual = puesto.uniformeCosto + puesto.equipoCosto + (puesto.vehiculoOpcional ? puesto.vehiculoCosto : 0) + (puesto.costoExamenesMensualizado ?? 0);
  const subtotal = costoLaboralMensual + bienesMensual;
  const overhead = round2(subtotal * Math.max(0,params.overheadPct));
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
  const params = modelParams();
  const puestosCalculados = puestos.map((p) => calcularPuesto(p, parametrosComerciales.grossMarginObjetivo, datosGenerales, params));
  const baseMensual = round2(puestosCalculados.reduce((acc,p) => acc + p.costoMensualTotal,0));

  // Bloques de Cost Summary ya parametrizados. Con defaults 0 no alteran el
  // resultado histórico; Jorge/Pricing puede activarlos desde Modelo Pricing.
  const indirectos = round2(baseMensual * Math.max(0,params.indirectPct));
  const ga = round2(baseMensual * Math.max(0,params.gaPct));
  const preFin = baseMensual + indirectos + ga;
  const financiamiento = round2(preFin * Math.max(0,params.financingPct));
  const costoMensualTotal = round2(preFin + financiamiento);
  const costoAnualTotal = round2(costoMensualTotal * 12);

  const margen = clampMargen(parametrosComerciales.grossMarginObjetivo);
  const precioMensualTotal = round2(costoMensualTotal / (1 - margen));
  const precioAnualTotal = round2(precioMensualTotal * 12);
  const fx = parametrosComerciales.tipoCambioUsdMxn && parametrosComerciales.tipoCambioUsdMxn > 0 ? parametrosComerciales.tipoCambioUsdMxn : params.fxUsdMxn > 0 ? params.fxUsdMxn : undefined;

  return {
    puestos:puestosCalculados,
    costoMensualTotal,
    costoAnualTotal,
    precioMensualTotal,
    precioAnualTotal,
    precioMensualUsd:fx ? round2(precioMensualTotal / fx) : undefined,
    precioAnualUsd:fx ? round2(precioAnualTotal / fx) : undefined,
    margenAplicado:margen,
  };
}
