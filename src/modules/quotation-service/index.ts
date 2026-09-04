// ============================================================================
// quotation-service
// ----------------------------------------------------------------------------
// Orchestrates quotation creation: calls pricing-engine to calculate,
// validation-engine to flag out-of-range fields and raise exceptions, takes
// the parameters snapshot, assigns the folio, and persists everything. UI
// wizards call this instead of touching quotationsRepo/pricing-engine/
// validation-engine directly, keeping business rules out of components.
// ============================================================================

import { quotationsRepo, catalogItemsRepo } from "../../data/db";
import { calcularCotizacion } from "../pricing-engine";
import { validarPuestos, crearExcepciones } from "../validation-engine";
import { recordAuditEntry } from "../audit-service";
import { newId, nowIso } from "../../lib/ids";
import type { DatosGenerales, ParametrosComerciales, PuestoCotizado, Quotation, QuotationStatus } from "../../types";

export function generateFolio(): string {
  const year = new Date().getFullYear();
  const existing = quotationsRepo.getAll().filter((q) => q.folio.startsWith(`PM-${year}-`));
  const next = existing.length + 1;
  return `PM-${year}-${String(next).padStart(5, "0")}`;
}

export interface CreateQuotationInput {
  datosGenerales: DatosGenerales;
  puestos: PuestoCotizado[];
  parametrosComerciales: ParametrosComerciales;
  createdBy: string;
  /** When true, saves as BORRADOR without calculating (sales can finish later). */
  asDraft?: boolean;
}

export function createQuotation(input: CreateQuotationInput): Quotation {
  const id = newId();
  const folio = generateFolio();

  if (input.asDraft) {
    const draft: Quotation = {
      id,
      folio,
      datosGenerales: input.datosGenerales,
      puestos: input.puestos,
      parametrosComerciales: input.parametrosComerciales,
      status: "BORRADOR",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      createdBy: input.createdBy,
      exceptionIds: [],
    };
    quotationsRepo.create(draft);
    return draft;
  }

  const resultado = calcularCotizacion(input.puestos, input.parametrosComerciales);

  const hallazgos = validarPuestos(input.puestos, input.datosGenerales);
  const status: QuotationStatus = hallazgos.length > 0 ? "PENDIENTE_VALIDACION" : "CALCULADA";

  const snapshotItems = catalogItemsRepo
    .getAll()
    .filter((c) => c.catalogType === "SALARIOS" || c.catalogType === "IMPUESTOS" || c.catalogType === "UNIFORMES");

  const quotation: Quotation = {
    id,
    folio,
    datosGenerales: input.datosGenerales,
    puestos: input.puestos,
    parametrosComerciales: input.parametrosComerciales,
    resultado,
    parametrosSnapshot: { tomadoEl: nowIso(), items: snapshotItems },
    status,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: input.createdBy,
    exceptionIds: [],
  };
  quotationsRepo.create(quotation);

  if (hallazgos.length > 0) {
    const exceptions = crearExcepciones(hallazgos, quotation.id, quotation.folio, input.datosGenerales.cliente, input.datosGenerales.vendedorNombre);
    quotation.exceptionIds = exceptions.map((e) => e.id);
    quotationsRepo.replace(quotation.id, quotation);

    recordAuditEntry({
      entidad: "COTIZACION",
      entidadId: quotation.id,
      descripcion: `Se generaron ${exceptions.length} excepción(es) automáticamente al calcular ${quotation.folio}`,
      usuario: input.datosGenerales.vendedorNombre,
    });
  }

  recordAuditEntry({
    entidad: "COTIZACION",
    entidadId: quotation.id,
    descripcion: `Se calculó la cotización ${quotation.folio} para ${input.datosGenerales.cliente}`,
    usuario: input.datosGenerales.vendedorNombre,
  });

  return quotation;
}

/** Calculates a BORRADOR quotation in place (same id/folio) instead of creating a new record. */
export function finalizeDraft(quotationId: string): Quotation | undefined {
  const draft = quotationsRepo.getById(quotationId);
  if (!draft) return undefined;

  const resultado = calcularCotizacion(draft.puestos, draft.parametrosComerciales);
  const hallazgos = validarPuestos(draft.puestos, draft.datosGenerales);
  const status: QuotationStatus = hallazgos.length > 0 ? "PENDIENTE_VALIDACION" : "CALCULADA";

  const snapshotItems = catalogItemsRepo
    .getAll()
    .filter((c) => c.catalogType === "SALARIOS" || c.catalogType === "IMPUESTOS" || c.catalogType === "UNIFORMES");

  let exceptionIds: string[] = [];
  if (hallazgos.length > 0) {
    const exceptions = crearExcepciones(hallazgos, draft.id, draft.folio, draft.datosGenerales.cliente, draft.datosGenerales.vendedorNombre);
    exceptionIds = exceptions.map((e) => e.id);
  }

  const updated: Quotation = {
    ...draft,
    resultado,
    parametrosSnapshot: { tomadoEl: nowIso(), items: snapshotItems },
    status,
    updatedAt: nowIso(),
    exceptionIds,
  };
  quotationsRepo.replace(quotationId, updated);

  recordAuditEntry({
    entidad: "COTIZACION",
    entidadId: updated.id,
    descripcion: `Se calculó la cotización ${updated.folio} para ${updated.datosGenerales.cliente}`,
    usuario: updated.datosGenerales.vendedorNombre,
  });

  return updated;
}

export function setQuotationStatus(id: string, status: QuotationStatus, actorName: string): Quotation | undefined {
  const updated = quotationsRepo.update(id, { status, updatedAt: nowIso() });
  if (updated) {
    recordAuditEntry({
      entidad: "COTIZACION",
      entidadId: id,
      descripcion: `Cotización ${updated.folio} cambió de estado a ${status}`,
      usuario: actorName,
    });
  }
  return updated;
}

export function listQuotations(): Quotation[] {
  return quotationsRepo.getAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function listQuotationsByVendedor(vendedorId: string): Quotation[] {
  return listQuotations().filter((q) => q.datosGenerales.vendedorId === vendedorId);
}

export function getQuotation(id: string): Quotation | undefined {
  return quotationsRepo.getById(id);
}
