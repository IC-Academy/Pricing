// ============================================================================
// Price Model 365 — datos reales de referencia extraídos de los Excel 2026
// ----------------------------------------------------------------------------
// Esta capa es deliberadamente estática para la demo funcional. Después será
// reemplazada por SharePoint / Fabric / SQL sin cambiar la UI.
// ============================================================================

import type { CiudadDemo, PerfilPuesto } from "../types";

export type TipoClienteDemo = "NUEVO" | "ACTUAL";

export interface ClienteActualDemo {
  id: string;
  cliente: string;
  site: string;
  ciudadOperativa: CiudadDemo;
  ciudadGeografica: string;
  estado: string;
  cargo: PerfilPuesto;
  salarioActual: number;
  tarifaActual: number;
}

export interface BenchmarkRealDemo {
  ciudad: CiudadDemo;
  puesto: PerfilPuesto;
  p25: number;
  p50: number;
  p75: number;
  recomendado: number;
  rotacionPct: number;
  fuente: string;
}

export const CLIENTES_ACTUALES_DEMO: ClienteActualDemo[] = [
  {
    id: "cli-aceites-gavilan",
    cliente: "ACEITES SUPERFINOS",
    site: "CEDIS GAVILAN",
    ciudadOperativa: "CDMX",
    ciudadGeografica: "Ciudad de México",
    estado: "CDMX",
    cargo: "Guardia Intramuros",
    salarioActual: 10926.14,
    tarifaActual: 21911.05,
  },
  {
    id: "cli-farmers-cdmx",
    cliente: "FARMERS",
    site: "BENITO JUAREZ",
    ciudadOperativa: "CDMX",
    ciudadGeografica: "Benito Juárez",
    estado: "CDMX",
    cargo: "Guardia Intramuros",
    salarioActual: 13613.33,
    tarifaActual: 26097,
  },
];

export const BENCHMARK_REAL_DEMO: BenchmarkRealDemo[] = [
  {
    ciudad: "Querétaro",
    puesto: "Guardia Intramuros",
    p25: 12650,
    p50: 13250,
    p75: 13900,
    recomendado: 13656,
    rotacionPct: 0.043,
    fuente: "Análisis de Salarios 2026 3.0",
  },
  {
    ciudad: "CDMX",
    puesto: "Guardia Intramuros",
    p25: 12800,
    p50: 13400,
    p75: 14100,
    recomendado: 13613.33,
    rotacionPct: 0.04,
    fuente: "PM MACHOTE 2026 / Gross Comp",
  },
  {
    ciudad: "Guadalajara",
    puesto: "Guardia Intramuros",
    p25: 12400,
    p50: 13100,
    p75: 13800,
    recomendado: 13450,
    rotacionPct: 0.045,
    fuente: "Análisis de Salarios 2026 3.0",
  },
];

export const PARAMETROS_LABORALES_2026 = {
  umaDiaria: 117.31,
  salarioMinimoDiario: 315.04,
  salarioMinimoZlfnDiario: 440.87,
  vacacionesDias: 12,
  primaVacacionalPct: 0.25,
  aguinaldoDias: 15.2,
  primaDominicalPct: 0.25,
  festivoFactor: 2,
  horasExtraDobleFactor: 2,
  horasExtraTripleFactor: 3,
  riesgoTrabajoB07Pct: 0.01475,
  profitReferenciaPct: 0.18,
};

export const ISN_2026: Record<string, number> = {
  "Ciudad de México": 0.04,
  CDMX: 0.04,
  Querétaro: 0.03,
  Jalisco: 0.03,
};

export const CASO_PARIDAD_MACHOTE = {
  cliente: "FARMERS",
  site: "BENITO JUAREZ",
  ciudad: "CDMX" as CiudadDemo,
  cargo: "Guardia Intramuros" as PerfilPuesto,
  cobertura: "12/5",
  horasPorDia: 12,
  diasPorSemana: 5,
  horasPorSemana: 60,
  horasFacturablesAnio: 3120,
  requeridoBase: 1,
  vacaciones: 0.04615384615384615,
  ausentismo: 0.023643076923076923,
  requeridoTotal: 1.069796923076923,
  precioPorPuesto: 26097,
};

export const BENCHMARK_EXTERNO_REFERENCIA = [
  {
    proveedor: "Allied Universal",
    plaza: "Monterrey",
    salario2026: 20300,
    tarifa2026: 39000,
    factor: 1.9212,
  },
];

export const PERMISO_AGUASCALIENTES_2026 = {
  estado: "Aguascalientes",
  costoFijo: 25970,
  costoRegistroElemento: 410,
  viajesMinimos: 3,
  costoViaje: 3500,
};

export function benchmarkPara(ciudad: CiudadDemo, puesto: PerfilPuesto): BenchmarkRealDemo | undefined {
  return BENCHMARK_REAL_DEMO.find((b) => b.ciudad === ciudad && b.puesto === puesto);
}

export function clienteActualPorId(id: string): ClienteActualDemo | undefined {
  return CLIENTES_ACTUALES_DEMO.find((c) => c.id === id);
}
