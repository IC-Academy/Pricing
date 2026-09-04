// ============================================================================
// validation-engine
// ----------------------------------------------------------------------------
// Compares values captured on a quotation against the authorized ranges
// defined in the catalogs. Never blocks the sale — it flags the field,
// shows the captured value / authorized range / differences, and raises a
// ValidationException for Pricing to review. Isolated from the UI and from
// pricing-engine on purpose: swapping in real validation rules later only
// means touching this file.
// ============================================================================

import type { CatalogItem, DatosGenerales, PuestoCotizado, ValidationException } from "../../types";
import { findApplicableCatalogItem, updateCatalogItem } from "../catalog-service";
import { recordAuditEntry } from "../audit-service";
import { exceptionsRepo } from "../../data/db";
import { newId, nowIso } from "../../lib/ids";

export interface CampoFueraDeRango {
  campo: string;
  valorCapturado: number;
  valorEsperadoMin: number;
  valorEsperadoMax: number;
  diferenciaAbsoluta: number;
  diferenciaPorcentual: number;
  catalogItem: CatalogItem;
}

/**
 * Validates every "puesto" of a quotation against the Salarios catalog
 * (min/max) for the given city. Returns one entry per field found out of
 * the authorized range. Extend this to validate uniforms/equipment/vehicle
 * against their own catalogs the same way.
 */
export function validarPuestos(puestos: PuestoCotizado[], datosGenerales: DatosGenerales): CampoFueraDeRango[] {
  const hallazgos: CampoFueraDeRango[] = [];

  puestos.forEach((puesto) => {
    const catalogItem = findApplicableCatalogItem("SALARIOS", puesto.tipoPuesto, datosGenerales.ciudad);
    if (!catalogItem || catalogItem.valorMin === undefined || catalogItem.valorMax === undefined) return;

    const { valorMin, valorMax } = catalogItem;
    if (puesto.salarioMensual < valorMin || puesto.salarioMensual > valorMax) {
      const mid = (valorMin + valorMax) / 2;
      const diferenciaAbsoluta = round2(puesto.salarioMensual - mid);
      const diferenciaPorcentual = mid !== 0 ? round4((puesto.salarioMensual - mid) / mid) : 0;
      hallazgos.push({
        campo: `Salario — ${puesto.tipoPuesto} — ${datosGenerales.ciudad}`,
        valorCapturado: puesto.salarioMensual,
        valorEsperadoMin: valorMin,
        valorEsperadoMax: valorMax,
        diferenciaAbsoluta,
        diferenciaPorcentual,
        catalogItem,
      });
    }
  });

  return hallazgos;
}

/** Persists a ValidationException for every out-of-range finding on a quotation. */
export function crearExcepciones(
  hallazgos: CampoFueraDeRango[],
  quotationId: string,
  quotationFolio: string,
  clienteNombre: string,
  vendedorNombre: string
): ValidationException[] {
  return hallazgos.map((h) => {
    const exception: ValidationException = {
      id: newId(),
      quotationId,
      quotationFolio,
      clienteNombre,
      vendedorNombre,
      campo: h.campo,
      valorCapturado: h.valorCapturado,
      valorEsperadoMin: h.valorEsperadoMin,
      valorEsperadoMax: h.valorEsperadoMax,
      diferenciaAbsoluta: h.diferenciaAbsoluta,
      diferenciaPorcentual: h.diferenciaPorcentual,
      fecha: nowIso(),
      status: "PENDIENTE",
      relatedCatalogItemId: h.catalogItem.id,
    };
    exceptionsRepo.create(exception);
    return exception;
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ---------------------------------------------------------------------------
// Exception resolution — Centro de Validaciones actions
// ---------------------------------------------------------------------------

export function listExceptions(): ValidationException[] {
  return exceptionsRepo.getAll().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export function acceptException(id: string, comentario: string, actorName: string): ValidationException | undefined {
  const updated = exceptionsRepo.update(id, {
    status: "ACEPTADA",
    comentarioResolucion: comentario,
    resueltoPor: actorName,
    resueltoEn: nowIso(),
  });
  if (updated) {
    recordAuditEntry({
      entidad: "EXCEPCION",
      entidadId: id,
      descripcion: `Excepción aceptada — ${updated.campo} en cotización ${updated.quotationFolio}`,
      usuario: actorName,
      comentario,
    });
  }
  return updated;
}

export function rejectException(id: string, comentario: string, actorName: string): ValidationException | undefined {
  const updated = exceptionsRepo.update(id, {
    status: "RECHAZADA",
    comentarioResolucion: comentario,
    resueltoPor: actorName,
    resueltoEn: nowIso(),
  });
  if (updated) {
    recordAuditEntry({
      entidad: "EXCEPCION",
      entidadId: id,
      descripcion: `Excepción rechazada — ${updated.campo} en cotización ${updated.quotationFolio}`,
      usuario: actorName,
      comentario,
    });
  }
  return updated;
}

export function requestAdjustment(id: string, comentario: string, actorName: string): ValidationException | undefined {
  const updated = exceptionsRepo.update(id, {
    status: "AJUSTE_SOLICITADO",
    comentarioResolucion: comentario,
    resueltoPor: actorName,
    resueltoEn: nowIso(),
  });
  if (updated) {
    recordAuditEntry({
      entidad: "EXCEPCION",
      entidadId: id,
      descripcion: `Se solicitó ajuste — ${updated.campo} en cotización ${updated.quotationFolio}`,
      usuario: actorName,
      comentario,
    });
  }
  return updated;
}

/** Widens the related catalog item's authorized range to cover the captured
 * value, turning the one-off exception into the new authorized parameter. */
export function convertExceptionToParameter(id: string, comentario: string, actorName: string): ValidationException | undefined {
  const exception = exceptionsRepo.getById(id);
  if (!exception || !exception.relatedCatalogItemId) return undefined;

  const nuevoMin = Math.min(exception.valorEsperadoMin, exception.valorCapturado);
  const nuevoMax = Math.max(exception.valorEsperadoMax, exception.valorCapturado);

  updateCatalogItem(
    exception.relatedCatalogItemId,
    { valorMin: nuevoMin, valorMax: nuevoMax, valor: Math.round((nuevoMin + nuevoMax) / 2) },
    actorName,
    `Convertido desde excepción de cotización ${exception.quotationFolio}: ${comentario}`
  );

  const updated = exceptionsRepo.update(id, {
    status: "CONVERTIDA_A_PARAMETRO",
    comentarioResolucion: comentario,
    resueltoPor: actorName,
    resueltoEn: nowIso(),
  });

  if (updated) {
    recordAuditEntry({
      entidad: "EXCEPCION",
      entidadId: id,
      descripcion: `Excepción convertida en nuevo parámetro — ${updated.campo} ahora acepta hasta ${nuevoMax}`,
      usuario: actorName,
      comentario,
    });
  }

  return updated;
}
