import type { CiudadDemo } from "../../types";
import { ESTRUCTURA_CIUDAD_DEMO, ISN_2026, PARAMETROS_LABORALES_2026 } from "../../data/price-model-real";

export interface FinancialModelParams {
  cargaSocialPct: number;
  overheadPct: number;
  indirectPct: number;
  gaPct: number;
  financingPct: number;
  grossMarginPct: number;
  fxUsdMxn: number;
  costoSupervisorMensual: number;
  costoCoordinadorRhMensual: number;
  costoReclutadorSrMensual: number;
  costoReclutadorMensual: number;
}

export interface FinancialScenarioInput {
  ciudad: CiudadDemo;
  salarioMensual: number;
  posiciones: number;
  /**
   * Multiplicador de HC por posición física. En el MACHOTE no siempre es 1:
   * incorpora relevo, vacaciones y ausentismo. Ejemplo control 12x5 CDMX:
   * 1 posición = 1.069796923 HC requerido total.
   */
  staffingFactor?: number;
  uniformeMensual: number;
  equipoMensual: number;
  vehiculoMensual: number;
  examenesMensual: number;
  otrosDirectosMensual: number;
}

export interface FinancialScenarioResult {
  laboral: {
    sueldo: number;
    aguinaldo: number;
    vacaciones: number;
    primaVacacional: number;
    isn: number;
    riesgoTrabajo: number;
    otrasCargas: number;
    totalUnitario: number;
    staffingFactor: number;
    hcCosteado: number;
    totalServicio: number;
  };
  estructura: {
    hcActual: number;
    hcProyectado: number;
    supervisoresActuales: number;
    supervisoresRequeridos: number;
    supervisoresAdicionales: number;
    reclutadoresActuales: number;
    reclutadoresRequeridos: number;
    reclutadoresAdicionales: number;
    costoMensual: number;
    requiereCostoPendiente: boolean;
  };
  costos: {
    labor: number;
    uniforme: number;
    equipo: number;
    vehiculo: number;
    examenes: number;
    otrosDirectos: number;
    estructura: number;
    subtotalDirecto: number;
    overhead: number;
    indirectos: number;
    ga: number;
    financiamiento: number;
    costoTotalMensual: number;
    costoTotalAnual: number;
  };
  precio: {
    gm: number;
    mensualMxn: number;
    anualMxn: number;
    mensualUsd: number;
    anualUsd: number;
  };
}

export const DEFAULT_FINANCIAL_MODEL_PARAMS: FinancialModelParams = {
  cargaSocialPct: PARAMETROS_LABORALES_2026.cargaSocialReferenciaPct,
  overheadPct: 0.08,
  indirectPct: 0,
  gaPct: 0,
  financingPct: 0,
  grossMarginPct: PARAMETROS_LABORALES_2026.profitReferenciaPct,
  fxUsdMxn: 18,
  costoSupervisorMensual: 0,
  costoCoordinadorRhMensual: 0,
  costoReclutadorSrMensual: 0,
  costoReclutadorMensual: 0,
};

const STORAGE_KEY = "pm365_financial_model_params_v1";
const r2 = (n:number) => Math.round(n * 100) / 100;
const clamp = (n:number,min:number,max:number) => Math.min(Math.max(Number.isFinite(n) ? n : min,min),max);

export function loadFinancialModelParams(): FinancialModelParams {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_FINANCIAL_MODEL_PARAMS, ...JSON.parse(raw) } : { ...DEFAULT_FINANCIAL_MODEL_PARAMS };
  } catch {
    return { ...DEFAULT_FINANCIAL_MODEL_PARAMS };
  }
}

export function saveFinancialModelParams(params: FinancialModelParams): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(params)); } catch { /* demo tolera storage restringido */ }
}

export function resetFinancialModelParams(): FinancialModelParams {
  const next = { ...DEFAULT_FINANCIAL_MODEL_PARAMS };
  saveFinancialModelParams(next);
  return next;
}

export function calculateFinancialScenario(input: FinancialScenarioInput, params: FinancialModelParams): FinancialScenarioResult {
  const salario = Math.max(0,input.salarioMensual);
  const posiciones = Math.max(1,Math.round(input.posiciones));
  const staffingFactor = Math.max(1, Number.isFinite(input.staffingFactor ?? 1) ? (input.staffingFactor ?? 1) : 1);
  const hcCosteado = r2(posiciones * staffingFactor);

  const diaria = salario / 30;
  const aguinaldo = r2(diaria * PARAMETROS_LABORALES_2026.aguinaldoDias / 12);
  const vacaciones = r2(diaria * PARAMETROS_LABORALES_2026.vacacionesDias / 12);
  const primaVacacional = r2(vacaciones * PARAMETROS_LABORALES_2026.primaVacacionalPct);
  const estadoKey = input.ciudad === "CDMX" ? "Ciudad de México" : input.ciudad === "Guadalajara" ? "Jalisco" : input.ciudad;
  const isn = r2(salario * (ISN_2026[estadoKey] ?? 0));
  const riesgoTrabajo = r2(salario * PARAMETROS_LABORALES_2026.riesgoTrabajoB07Pct);
  const cargaObjetivo = r2(salario * clamp(params.cargaSocialPct,0,2));
  const conocidas = aguinaldo + vacaciones + primaVacacional + isn + riesgoTrabajo;
  const otrasCargas = r2(Math.max(0,cargaObjetivo - conocidas));
  const totalUnitario = r2(salario + cargaObjetivo);
  const totalServicio = r2(totalUnitario * hcCosteado);

  const est = ESTRUCTURA_CIUDAD_DEMO.find((e)=>e.ciudad===input.ciudad);
  const hcActual = est?.hc ?? 0;
  const hcProyectado = r2(hcActual + hcCosteado);
  const supRatio = est?.hcPorSupervisor && est.hcPorSupervisor > 0 ? est.hcPorSupervisor : 100;
  const supervisoresActuales = est?.supervisores ?? 0;
  const supervisoresRequeridos = Math.max(supervisoresActuales,Math.ceil(hcProyectado / supRatio));
  const supervisoresAdicionales = Math.max(0,supervisoresRequeridos-supervisoresActuales);

  const recRatio = est?.personasPorReclutador && est.personasPorReclutador > 0 ? est.personasPorReclutador : 0;
  const reclutadoresActuales = (est?.reclutadores ?? 0) + (est?.reclutadoresSr ?? 0);
  const reclutadoresRequeridos = recRatio > 0 ? Math.max(reclutadoresActuales,Math.ceil(hcProyectado / recRatio)) : reclutadoresActuales;
  const reclutadoresAdicionales = Math.max(0,reclutadoresRequeridos-reclutadoresActuales);

  const costoEstructura = r2(
    supervisoresAdicionales * Math.max(0,params.costoSupervisorMensual) +
    reclutadoresAdicionales * Math.max(0,params.costoReclutadorMensual)
  );
  const requiereCostoPendiente = (supervisoresAdicionales > 0 && params.costoSupervisorMensual <= 0) || (reclutadoresAdicionales > 0 && params.costoReclutadorMensual <= 0);

  // Uniforme/equipo/exámenes se costean por posición física, no por HC de cobertura,
  // hasta validar con Jorge qué conceptos se entregan también a relevos/contingencia.
  const uniforme = r2(Math.max(0,input.uniformeMensual) * posiciones);
  const equipo = r2(Math.max(0,input.equipoMensual) * posiciones);
  const vehiculo = r2(Math.max(0,input.vehiculoMensual));
  const examenes = r2(Math.max(0,input.examenesMensual) * posiciones);
  const otrosDirectos = r2(Math.max(0,input.otrosDirectosMensual));
  const subtotalDirecto = r2(totalServicio + uniforme + equipo + vehiculo + examenes + otrosDirectos + costoEstructura);
  const overhead = r2(subtotalDirecto * clamp(params.overheadPct,0,1));
  const indirectos = r2(subtotalDirecto * clamp(params.indirectPct,0,1));
  const ga = r2(subtotalDirecto * clamp(params.gaPct,0,1));
  const preFin = subtotalDirecto + overhead + indirectos + ga;
  const financiamiento = r2(preFin * clamp(params.financingPct,0,1));
  const costoTotalMensual = r2(preFin + financiamiento);
  const costoTotalAnual = r2(costoTotalMensual * 12);
  const gm = clamp(params.grossMarginPct,0,0.85);
  const mensualMxn = r2(costoTotalMensual / (1-gm));
  const anualMxn = r2(mensualMxn * 12);
  const fx = params.fxUsdMxn > 0 ? params.fxUsdMxn : 1;

  return {
    laboral:{ sueldo:salario, aguinaldo, vacaciones, primaVacacional, isn, riesgoTrabajo, otrasCargas, totalUnitario, staffingFactor, hcCosteado, totalServicio },
    estructura:{ hcActual, hcProyectado, supervisoresActuales, supervisoresRequeridos, supervisoresAdicionales, reclutadoresActuales, reclutadoresRequeridos, reclutadoresAdicionales, costoMensual:costoEstructura, requiereCostoPendiente },
    costos:{ labor:totalServicio, uniforme, equipo, vehiculo, examenes, otrosDirectos, estructura:costoEstructura, subtotalDirecto, overhead, indirectos, ga, financiamiento, costoTotalMensual, costoTotalAnual },
    precio:{ gm, mensualMxn, anualMxn, mensualUsd:r2(mensualMxn/fx), anualUsd:r2(anualMxn/fx) },
  };
}
