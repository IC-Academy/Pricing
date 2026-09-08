// ============================================================================
// Price Model 365 — datos reales/referenciales de los Excel 2026
// Esta capa es estática para demo y será sustituida por SharePoint/Fabric/SQL.
// ============================================================================

import type { CiudadDemo, NivelPerfil, PerfilPuesto, TipoExamen } from "../types";

export type TipoClienteDemo = "NUEVO" | "ACTUAL";

export interface ClienteActualDemo {
  id:string; cliente:string; site:string; ciudadOperativa:CiudadDemo; ciudadGeografica:string; estado:string;
  cargo:PerfilPuesto; salarioActual:number; tarifaActual:number;
}

export interface BenchmarkRealDemo {
  ciudad:CiudadDemo; puesto:PerfilPuesto; p25:number; p50:number; p75:number; recomendado:number; rotacionPct:number; fuente:string;
}

export const CLIENTES_ACTUALES_DEMO: ClienteActualDemo[] = [
  { id:"cli-aceites-gavilan", cliente:"ACEITES SUPERFINOS", site:"CEDIS GAVILAN", ciudadOperativa:"CDMX", ciudadGeografica:"Ciudad de México", estado:"CDMX", cargo:"Guardia Intramuros", salarioActual:10926.14, tarifaActual:21911.05 },
  { id:"cli-farmers-cdmx", cliente:"FARMERS", site:"BENITO JUAREZ", ciudadOperativa:"CDMX", ciudadGeografica:"Benito Juárez", estado:"CDMX", cargo:"Guardia Intramuros", salarioActual:13613.33, tarifaActual:26097 },
];

export const BENCHMARK_REAL_DEMO: BenchmarkRealDemo[] = [
  { ciudad:"Querétaro", puesto:"Guardia Intramuros", p25:12650, p50:13250, p75:13900, recomendado:13656, rotacionPct:0.043, fuente:"Análisis de Salarios 2026 3.0" },
  { ciudad:"CDMX", puesto:"Guardia Intramuros", p25:12800, p50:13400, p75:14100, recomendado:13613.33, rotacionPct:0.04, fuente:"PM MACHOTE 2026 / Gross Comp" },
  { ciudad:"Guadalajara", puesto:"Guardia Intramuros", p25:12400, p50:13100, p75:13800, recomendado:13450, rotacionPct:0.045, fuente:"Análisis de Salarios 2026 3.0" },
];

export const MULTIPLICADOR_PERFIL: Record<NivelPerfil, number> = { A:1, AA:1.06, ELITE:1.14 };

export const PERFIL_REQUISITOS: Record<NivelPerfil, { etiqueta:string; experiencia:string; escolaridad:string; habilidades:string[] }> = {
  A:{ etiqueta:"Perfil A", experiencia:"Sin experiencia / básica según puesto", escolaridad:"Secundaria", habilidades:["Control de acceso","Registro de personas","Rondín","Reportes en bitácora","Interacciones personales"] },
  AA:{ etiqueta:"Perfil AA", experiencia:"6 meses a 1 año", escolaridad:"Secundaria/Bachillerato según puesto", habilidades:["Perfil A","Elaboración de reportes mediante software","Manejo de radio/conmutador/CCTV"] },
  ELITE:{ etiqueta:"Perfil Elite", experiencia:"1 año en adelante", escolaridad:"Bachillerato", habilidades:["Perfil AA","Requerimientos directos del cliente","Logística de servicio","E-Track","Manejo de PC"] },
};

export interface EstructuraCiudadDemo {
  ciudad:CiudadDemo; region:string; supervisores:number; coordinadoresRh:number; reclutadoresSr:number; reclutadores:number;
  hc:number; bajas:number; rotacionPct:number; hcPorSupervisor:number; personasPorReclutador:number;
}

export const ESTRUCTURA_CIUDAD_DEMO:EstructuraCiudadDemo[] = [
  { ciudad:"Querétaro", region:"BAJÍO-CENTRO-SUR", supervisores:1, coordinadoresRh:0, reclutadoresSr:0, reclutadores:1, hc:42, bajas:9, rotacionPct:1.464, hcPorSupervisor:42, personasPorReclutador:6 },
  { ciudad:"Guadalajara", region:"BAJÍO-CENTRO-SUR", supervisores:2, coordinadoresRh:1, reclutadoresSr:0, reclutadores:2, hc:158, bajas:32, rotacionPct:1.677, hcPorSupervisor:79, personasPorReclutador:23 },
  { ciudad:"CDMX", region:"METRO", supervisores:9, coordinadoresRh:2, reclutadoresSr:1, reclutadores:3, hc:856, bajas:59, rotacionPct:0.771, hcPorSupervisor:95.11, personasPorReclutador:55.02 },
];

export interface ExamenCatalogoDemo {
  id:TipoExamen; nombre:string; categoria:"EXAMEN"|"CONFIANZA"; obligatorioIc:boolean;
  costoReferencia:number|null; requiereValidacion:boolean; fuente:string;
}

export const EXAMENES_DEMO:ExamenCatalogoDemo[] = [
  { id:"MEDICO", nombre:"Examen médico", categoria:"EXAMEN", obligatorioIc:true, costoReferencia:327, requiereValidacion:false, fuente:"EXAMENES, CAPACITACION E INDUCCION / EXAMENES" },
  { id:"ANTIDOPING", nombre:"Anti-Doping", categoria:"EXAMEN", obligatorioIc:true, costoReferencia:102, requiereValidacion:false, fuente:"EXAMENES, CAPACITACION E INDUCCION / EXAMENES" },
  { id:"POLIGRAFO", nombre:"Polígrafo", categoria:"CONFIANZA", obligatorioIc:false, costoReferencia:2500, requiereValidacion:false, fuente:"EXAMENES, CAPACITACION E INDUCCION / EXAMENES" },
  { id:"SOCIOECONOMICO", nombre:"Socioeconómico", categoria:"CONFIANZA", obligatorioIc:false, costoReferencia:900, requiereValidacion:false, fuente:"EXAMENES, CAPACITACION E INDUCCION / EXAMENES" },
  { id:"AUDIOMETRIA_OPTOMETRIA", nombre:"Audiometría / Optometría", categoria:"EXAMEN", obligatorioIc:false, costoReferencia:null, requiereValidacion:true, fuente:"EXAMENES, CAPACITACION E INDUCCION / EXAMENES" },
  { id:"PSICOMETRIA", nombre:"Psicometría", categoria:"EXAMEN", obligatorioIc:true, costoReferencia:null, requiereValidacion:true, fuente:"EXAMENES, CAPACITACION E INDUCCION / EXAMENES" },
];

export const EXAMENES_OBLIGATORIOS_IC:TipoExamen[] = EXAMENES_DEMO.filter((x)=>x.obligatorioIc).map((x)=>x.id);
export const COSTO_OBLIGATORIO_CONOCIDO_POR_ALTA = EXAMENES_DEMO.filter((x)=>x.obligatorioIc&&x.costoReferencia!==null).reduce((a,x)=>a+(x.costoReferencia??0),0);
export const EXAMENES_OBLIGATORIOS_SIN_COSTO = EXAMENES_DEMO.filter((x)=>x.obligatorioIc&&x.costoReferencia===null).map((x)=>x.id);
export function costoExamenesPorAlta(examenes:TipoExamen[]):number { return examenes.reduce((t,id)=>t+(EXAMENES_DEMO.find((x)=>x.id===id)?.costoReferencia??0),0); }

export const PARAMETROS_LABORALES_2026 = {
  umaDiaria:117.31,
  salarioMinimoDiario:315.04,
  salarioMinimoZlfnDiario:440.87,
  vacacionesDias:12,
  primaVacacionalPct:0.25,
  // Regla funcional confirmada con Pricing: 15 días sobre salario base.
  // El MACHOTE recibido conserva 15.2; el sistema usa 15 por instrucción del owner funcional.
  aguinaldoDias:15,
  primaDominicalPct:0.25,
  festivoFactor:2,
  horasExtraDobleFactor:2,
  horasExtraTripleFactor:3,
  riesgoTrabajoB07Pct:0.01475,
  profitReferenciaPct:0.18,
  cargaSocialReferenciaPct:0.42,
};

export const ISN_2026:Record<string,number> = { "Ciudad de México":0.04, CDMX:0.04, Querétaro:0.03, Jalisco:0.03 };

export const CASO_PARIDAD_MACHOTE = {
  cliente:"FARMERS", site:"BENITO JUAREZ", ciudad:"CDMX" as CiudadDemo, cargo:"Guardia Intramuros" as PerfilPuesto,
  cobertura:"12/5", horasPorDia:12, diasPorSemana:5, horasPorSemana:60, horasFacturablesAnio:3120,
  requeridoBase:1, vacaciones:0.04615384615384615, ausentismo:0.023643076923076923,
  requeridoTotal:1.069796923076923, precioPorPuesto:26097,
};

export const BENCHMARK_EXTERNO_REFERENCIA = [{ proveedor:"Allied Universal", plaza:"Monterrey", salario2026:20300, tarifa2026:39000, factor:1.9212 }];
export const PERMISO_AGUASCALIENTES_2026 = { estado:"Aguascalientes", costoFijo:25970, costoRegistroElemento:410, viajesMinimos:3, costoViaje:3500 };

export function benchmarkPara(ciudad:CiudadDemo,puesto:PerfilPuesto){return BENCHMARK_REAL_DEMO.find((b)=>b.ciudad===ciudad&&b.puesto===puesto);}
export function clienteActualPorId(id:string){return CLIENTES_ACTUALES_DEMO.find((c)=>c.id===id);}
export function estructuraPara(ciudad:CiudadDemo){return ESTRUCTURA_CIUDAD_DEMO.find((e)=>e.ciudad===ciudad);}
export function salarioPorNivel(base:number,nivel:NivelPerfil){return Math.round(base*MULTIPLICADOR_PERFIL[nivel]*100)/100;}
