// ============================================================================
// quotation-service
// ============================================================================

import { quotationsRepo, catalogItemsRepo, exceptionsRepo } from "../../data/db";
import { EXAMENES_DEMO, EXAMENES_OBLIGATORIOS_IC } from "../../data/price-model-real";
import { calcularCotizacion } from "../pricing-engine";
import { calcularHcRequeridoTotal } from "../staffing";
import { validarPuestos, crearExcepciones } from "../validation-engine";
import { recordAuditEntry } from "../audit-service";
import { newId, nowIso } from "../../lib/ids";
import type { DatosGenerales, ParametrosComerciales, PuestoCotizado, Quotation, QuotationStatus, ValidationException } from "../../types";

export const DISCLAIMER_COTIZACION_PRELIMINAR = "Cotización preliminar sujeta a revalidación por las áreas correspondientes. Los costos estimados pueden modificarse durante la validación final. Tiempo objetivo de respuesta para cotización final: 2 días hábiles.";
export const LIMITE_HC_REVISION_OBLIGATORIA = 30;

export function generateFolio(): string {
  const year = new Date().getFullYear();
  const existing = quotationsRepo.getAll().filter((q) => q.folio.startsWith(`PM-${year}-`));
  return `PM-${year}-${String(existing.length + 1).padStart(5, "0")}`;
}

export interface ManualValidationInput { campo:string; valorCapturado:number; comentario?:string; }
export interface CreateQuotationInput {
  datosGenerales:DatosGenerales; puestos:PuestoCotizado[]; parametrosComerciales:ParametrosComerciales; createdBy:string;
  asDraft?:boolean; manualValidations?:ManualValidationInput[];
}

function normalizePuestos(puestos:PuestoCotizado[]):PuestoCotizado[] {
  return puestos.map((p)=>({ ...p, examenes:[...new Set([...(p.examenes ?? []), ...EXAMENES_OBLIGATORIOS_IC])] }));
}

function withPreliminaryDisclaimer(parametros:ParametrosComerciales):ParametrosComerciales {
  const observaciones=parametros.observaciones?.trim() ?? "";
  if(observaciones.includes(DISCLAIMER_COTIZACION_PRELIMINAR)) return parametros;
  return { ...parametros, observaciones:[observaciones,DISCLAIMER_COTIZACION_PRELIMINAR].filter(Boolean).join("\n\n") };
}

function validacionesExamenesObligatorios(puestos:PuestoCotizado[]):ManualValidationInput[] {
  return puestos.flatMap((p,idx)=>(p.examenes ?? []).flatMap((id)=>{
    const examen=EXAMENES_DEMO.find((x)=>x.id===id);
    if(!examen?.obligatorioIc || examen.costoReferencia!==null) return [];
    return [{ campo:`Examen obligatorio sin costo — Puesto ${idx+1} — ${examen.nombre}`, valorCapturado:0, comentario:`${examen.nombre} es obligatorio en reclutamiento IC, pero el catálogo fuente no tiene costo. Pricing debe capturar/validar el importe antes de liberar la propuesta final.` }];
  }));
}

function validacionPorTamano(puestos:PuestoCotizado[]):ManualValidationInput[] {
  const hc=calcularHcRequeridoTotal(puestos);
  if(hc<=LIMITE_HC_REVISION_OBLIGATORIA) return [];
  return [{ campo:"Revisión obligatoria por tamaño del servicio", valorCapturado:hc, comentario:`El servicio requiere ${hc} HC según esquema de 72 horas. Toda cotización mayor a ${LIMITE_HC_REVISION_OBLIGATORIA} HC debe ser revisada por Pricing antes de liberar propuesta final.` }];
}

function takeParametersSnapshot() {
  return catalogItemsRepo.getAll().filter((c) => ["SALARIOS", "IMPUESTOS", "UNIFORMES", "VEHICULOS", "EQUIPAMIENTO"].includes(c.catalogType));
}

function crearExcepcionesManuales(hallazgos:ManualValidationInput[], quotationId:string, quotationFolio:string, clienteNombre:string, vendedorNombre:string):ValidationException[] {
  return hallazgos.map((h) => {
    const exception:ValidationException = {
      id:newId(), quotationId, quotationFolio, clienteNombre, vendedorNombre, campo:h.campo,
      valorCapturado:h.valorCapturado, valorEsperadoMin:0, valorEsperadoMax:0,
      diferenciaAbsoluta:h.valorCapturado, diferenciaPorcentual:0, fecha:nowIso(), status:"PENDIENTE", comentarioResolucion:h.comentario,
    };
    exceptionsRepo.create(exception); return exception;
  });
}

export function createQuotation(input:CreateQuotationInput):Quotation {
  const id=newId(); const folio=generateFolio();
  const puestos=normalizePuestos(input.puestos);
  const parametrosComerciales=withPreliminaryDisclaimer(input.parametrosComerciales);
  if (input.asDraft) {
    const draft:Quotation={id,folio,datosGenerales:input.datosGenerales,puestos,parametrosComerciales,status:"BORRADOR",createdAt:nowIso(),updatedAt:nowIso(),createdBy:input.createdBy,exceptionIds:[]};
    quotationsRepo.create(draft); return draft;
  }

  const resultado=calcularCotizacion(puestos,parametrosComerciales,input.datosGenerales);
  const hallazgos=validarPuestos(puestos,input.datosGenerales);
  const manuales=[...(input.manualValidations ?? []),...validacionesExamenesObligatorios(puestos),...validacionPorTamano(puestos)];
  const status:QuotationStatus=hallazgos.length>0 || manuales.length>0 ? "PENDIENTE_VALIDACION" : "CALCULADA";
  const quotation:Quotation={id,folio,datosGenerales:input.datosGenerales,puestos,parametrosComerciales,resultado,parametrosSnapshot:{tomadoEl:nowIso(),items:takeParametersSnapshot()},status,createdAt:nowIso(),updatedAt:nowIso(),createdBy:input.createdBy,exceptionIds:[]};
  quotationsRepo.create(quotation);

  const exceptions=[
    ...crearExcepciones(hallazgos,quotation.id,quotation.folio,input.datosGenerales.cliente,input.datosGenerales.vendedorNombre),
    ...crearExcepcionesManuales(manuales,quotation.id,quotation.folio,input.datosGenerales.cliente,input.datosGenerales.vendedorNombre),
  ];
  if (exceptions.length>0) {
    quotation.exceptionIds=exceptions.map((e)=>e.id); quotationsRepo.replace(quotation.id,quotation);
    recordAuditEntry({entidad:"COTIZACION",entidadId:quotation.id,descripcion:`Se generaron ${exceptions.length} excepción(es) automáticamente al calcular ${quotation.folio}`,usuario:input.datosGenerales.vendedorNombre});
  }
  recordAuditEntry({entidad:"COTIZACION",entidadId:quotation.id,descripcion:`Se calculó la cotización ${quotation.folio} para ${input.datosGenerales.cliente}`,usuario:input.datosGenerales.vendedorNombre});
  return quotation;
}

export function finalizeDraft(quotationId:string):Quotation|undefined {
  const draft=quotationsRepo.getById(quotationId); if(!draft) return undefined;
  const puestos=normalizePuestos(draft.puestos);
  const parametrosComerciales=withPreliminaryDisclaimer(draft.parametrosComerciales);
  const resultado=calcularCotizacion(puestos,parametrosComerciales,draft.datosGenerales);
  const hallazgos=validarPuestos(puestos,draft.datosGenerales);
  const manuales=[...validacionesExamenesObligatorios(puestos),...validacionPorTamano(puestos)];
  const status:QuotationStatus=hallazgos.length>0 || manuales.length>0?"PENDIENTE_VALIDACION":"CALCULADA";
  const exceptions=[
    ...crearExcepciones(hallazgos,draft.id,draft.folio,draft.datosGenerales.cliente,draft.datosGenerales.vendedorNombre),
    ...crearExcepcionesManuales(manuales,draft.id,draft.folio,draft.datosGenerales.cliente,draft.datosGenerales.vendedorNombre),
  ];
  const updated:Quotation={...draft,puestos,parametrosComerciales,resultado,parametrosSnapshot:{tomadoEl:nowIso(),items:takeParametersSnapshot()},status,updatedAt:nowIso(),exceptionIds:exceptions.map((e)=>e.id)};
  quotationsRepo.replace(quotationId,updated);
  recordAuditEntry({entidad:"COTIZACION",entidadId:updated.id,descripcion:`Se calculó la cotización ${updated.folio} para ${updated.datosGenerales.cliente}`,usuario:updated.datosGenerales.vendedorNombre});
  return updated;
}

export function setQuotationStatus(id:string,status:QuotationStatus,actorName:string):Quotation|undefined {
  const updated=quotationsRepo.update(id,{status,updatedAt:nowIso()});
  if(updated) recordAuditEntry({entidad:"COTIZACION",entidadId:id,descripcion:`Cotización ${updated.folio} cambió de estado a ${status}`,usuario:actorName});
  return updated;
}
export function listQuotations():Quotation[]{return quotationsRepo.getAll().sort((a,b)=>(a.createdAt<b.createdAt?1:-1));}
export function listQuotationsByVendedor(vendedorId:string):Quotation[]{return listQuotations().filter((q)=>q.datosGenerales.vendedorId===vendedorId);}
export function getQuotation(id:string):Quotation|undefined{return quotationsRepo.getById(id);}
