// ============================================================================
// pricing-engine — V0.9
// Gross Comp + exámenes reales + esquema 72 h + bienes por cantidad de servicio.
// ============================================================================

import type { DatosGenerales, DesgloseCostoLaboral, ParametrosComerciales, PuestoCalculado, PuestoCotizado, ResultadoCalculo, TipoExamen } from "../../types";
import { EXAMENES_DEMO, EXAMENES_OBLIGATORIOS_IC, ISN_2026, PARAMETROS_LABORALES_2026 } from "../../data/price-model-real";
import { DEFAULT_FINANCIAL_MODEL_PARAMS, loadFinancialModelParams, type FinancialModelParams } from "../financial-model";
import { calcularHcRequeridoPuesto, calcularHcRequeridoTotal } from "../staffing";

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
function examenesEfectivos(puesto:PuestoCotizado):TipoExamen[] {
  return [...new Set([...(puesto.examenes ?? []), ...EXAMENES_OBLIGATORIOS_IC])];
}

export function costoConocidoExamenesPorAlta(puesto:PuestoCotizado):number {
  return round2(examenesEfectivos(puesto).reduce((total,id)=>{
    const costo=EXAMENES_DEMO.find((x)=>x.id===id)?.costoReferencia;
    return total + (costo ?? 0);
  },0));
}

export function costoMensualExamenes(puesto:PuestoCotizado):number {
  const conocidoMensual=round2(costoConocidoExamenesPorAlta(puesto)/12);
  return round2(conocidoMensual + Math.max(0,puesto.costoExamenesMensualizado ?? 0));
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

export function calcularCostoLaboralMensual(salarioMensual:number):number {
  return round2(salarioMensual * (1 + CARGA_SOCIAL_PCT));
}

export function calcularPuesto(puesto:PuestoCotizado, margenObjetivo:number, datosGenerales?:DatosGenerales, params:FinancialModelParams = modelParams()):PuestoCalculado {
  const dimension=calcularHcRequeridoPuesto(puesto);
  const desgloseLaboral = calcularDesgloseLaboral(puesto.salarioMensual, datosGenerales, params);
  const costoLaboralMensual = desgloseLaboral.costoLaboralTotal;
  const examenesMensual=costoMensualExamenes(puesto);

  // Mano de obra y exámenes de ingreso se costean por HC realmente requerido.
  const laboralGrupo=round2(costoLaboralMensual*dimension.hcRequerido);
  const examenesGrupo=round2(examenesMensual*dimension.hcRequerido);

  // Desde V0.9 uniforme/equipo/vehículo representan el TOTAL MENSUAL DEL GRUPO.
  // El configurador ya aplica cantidad y periodicidad; no se multiplican de nuevo por posiciones ni HC.
  const uniformesGrupo=round2(Math.max(0,puesto.uniformeCosto));
  const equipoGrupo=round2(Math.max(0,puesto.equipoCosto));
  const vehiculosGrupo=round2(puesto.vehiculoOpcional?Math.max(0,puesto.vehiculoCosto):0);
  const bienesGrupo=round2(uniformesGrupo+equipoGrupo+vehiculosGrupo);

  const subtotalGrupo=round2(laboralGrupo+examenesGrupo+bienesGrupo);
  const overhead=round2(subtotalGrupo*Math.max(0,params.overheadPct));
  const costoMensualTotal=round2(subtotalGrupo+overhead);
  const costoAnualTotal=round2(costoMensualTotal*12);
  const margenSeguro=clampMargen(margenObjetivo);
  const precioTotalPuesto=round2(costoMensualTotal/(1-margenSeguro));
  const precioRecomendadoUnitario=round2(precioTotalPuesto/Math.max(1,puesto.cantidadPosiciones));
  const precioAnualPuesto=round2(precioTotalPuesto*12);

  return {
    ...puesto,
    examenes:examenesEfectivos(puesto),
    costoExamenesMensualizado:examenesMensual,
    horasSemana:dimension.horasSemana,
    hcRequerido:dimension.hcRequerido,
    costoLaboralMensual,
    desgloseLaboral,
    costoMensualTotal,
    costoAnualTotal,
    precioRecomendadoUnitario,
    precioTotalPuesto,
    precioAnualPuesto,
  };
}

export function calcularCotizacion(puestos:PuestoCotizado[], parametrosComerciales:ParametrosComerciales, datosGenerales?:DatosGenerales):ResultadoCalculo {
  const params=modelParams();
  const puestosCalculados=puestos.map((p)=>calcularPuesto(p,parametrosComerciales.grossMarginObjetivo,datosGenerales,params));
  const baseMensual=round2(puestosCalculados.reduce((acc,p)=>acc+p.costoMensualTotal,0));
  const indirectos=round2(baseMensual*Math.max(0,params.indirectPct));
  const ga=round2(baseMensual*Math.max(0,params.gaPct));
  const preFin=baseMensual+indirectos+ga;
  const financiamiento=round2(preFin*Math.max(0,params.financingPct));
  const costoMensualTotal=round2(preFin+financiamiento);
  const costoAnualTotal=round2(costoMensualTotal*12);
  const margen=clampMargen(parametrosComerciales.grossMarginObjetivo);
  const precioMensualTotal=round2(costoMensualTotal/(1-margen));
  const precioAnualTotal=round2(precioMensualTotal*12);
  const fx=parametrosComerciales.tipoCambioUsdMxn&&parametrosComerciales.tipoCambioUsdMxn>0?parametrosComerciales.tipoCambioUsdMxn:params.fxUsdMxn>0?params.fxUsdMxn:undefined;

  return {
    puestos:puestosCalculados,
    hcRequeridoTotal:calcularHcRequeridoTotal(puestos),
    costoMensualTotal,
    costoAnualTotal,
    precioMensualTotal,
    precioAnualTotal,
    precioMensualUsd:fx?round2(precioMensualTotal/fx):undefined,
    precioAnualUsd:fx?round2(precioAnualTotal/fx):undefined,
    margenAplicado:margen,
  };
}
