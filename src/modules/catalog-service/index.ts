// ============================================================================
// catalog-service
// ----------------------------------------------------------------------------
// Owns all read/write access to catalog items: CRUD, activation state,
// vigencia (validity) computation, and change history. UI screens call these
// functions instead of talking to catalogItemsRepo/catalogHistoryRepo
// directly, so vigencia rules and audit trail hooks live in one place.
// ============================================================================

import { catalogItemsRepo, catalogHistoryRepo } from "../../data/db";
import { recordAuditEntry } from "../audit-service";
import { newId, nowIso } from "../../lib/ids";
import { computeVigenciaEstado } from "../../lib/vigencia";
import type { CatalogItem, CatalogType, VigenciaEstado } from "../../types";

export function listCatalogItems(catalogType?: CatalogType): CatalogItem[] {
  const all = catalogItemsRepo.getAll();
  return catalogType ? all.filter((i) => i.catalogType === catalogType) : all;
}

export function getCatalogItem(id: string): CatalogItem | undefined {
  return catalogItemsRepo.getById(id);
}

export function getCatalogHistory(catalogItemId: string) {
  return catalogHistoryRepo
    .getAll()
    .filter((h) => h.catalogItemId === catalogItemId)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export interface CreateCatalogInput extends Omit<CatalogItem, "id" | "ultimaActualizacion" | "activo"> {
  activo?: boolean;
}

export function createCatalogItem(input: CreateCatalogInput, actorName: string): CatalogItem {
  const item: CatalogItem = {
    ...input,
    id: newId(),
    activo: input.activo ?? true,
    ultimaActualizacion: nowIso(),
  };
  catalogItemsRepo.create(item);
  recordAuditEntry({
    entidad: "CATALOGO",
    entidadId: item.id,
    descripcion: `Se creó el registro "${item.nombre}" (${item.catalogType}) — ${item.ubicacion}`,
    valorNuevo: JSON.stringify({ valor: item.valor, unidad: item.unidad }),
    usuario: actorName,
  });
  return item;
}

export function updateCatalogItem(
  id: string,
  patch: Partial<CatalogItem>,
  actorName: string,
  comentario?: string
): CatalogItem | undefined {
  const before = catalogItemsRepo.getById(id);
  if (!before) return undefined;

  const after: CatalogItem = { ...before, ...patch, ultimaActualizacion: nowIso(), usuarioModifico: actorName };
  catalogItemsRepo.replace(id, after);

  catalogHistoryRepo.create({
    id: newId(),
    catalogItemId: id,
    fecha: nowIso(),
    usuario: actorName,
    campoAnterior: diffOnly(before, after).before,
    campoNuevo: diffOnly(before, after).after,
    comentario,
  });

  recordAuditEntry({
    entidad: "CATALOGO",
    entidadId: id,
    descripcion: `Se actualizó "${after.nombre}" (${after.catalogType}) — ${after.ubicacion}`,
    valorAnterior: formatChangedValue(diffOnly(before, after).before),
    valorNuevo: formatChangedValue(diffOnly(before, after).after),
    usuario: actorName,
    comentario,
  });

  return after;
}

export function setCatalogItemActive(id: string, active: boolean, actorName: string): CatalogItem | undefined {
  const item = updateCatalogItem(id, { activo: active }, actorName, active ? "Reactivado" : "Desactivado");
  return item;
}

function diffOnly(before: CatalogItem, after: CatalogItem) {
  const beforeDiff: Record<string, unknown> = {};
  const afterDiff: Record<string, unknown> = {};
  (Object.keys(after) as (keyof CatalogItem)[]).forEach((key) => {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      beforeDiff[key] = before[key];
      afterDiff[key] = after[key];
    }
  });
  return { before: beforeDiff, after: afterDiff };
}

function formatChangedValue(fields: Record<string, unknown>): string {
  const entries = Object.entries(fields);
  if (entries.length === 0) return "—";
  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
}

/** Computes the vigencia state of a catalog item relative to "today". */
export function getVigenciaEstado(item: CatalogItem, today: Date = new Date()): VigenciaEstado {
  return computeVigenciaEstado(item, today);
}

export function countByVigencia(items: CatalogItem[], today: Date = new Date()) {
  const counts: Record<VigenciaEstado, number> = {
    VIGENTE: 0,
    PROXIMO_A_VENCER: 0,
    VENCIDO: 0,
    SIN_VIGENCIA: 0,
  };
  items.forEach((i) => {
    counts[getVigenciaEstado(i, today)] += 1;
  });
  return counts;
}

/**
 * Looks up the currently-applicable range (min/max) for a given catalog
 * type + a free-text match on nombre/ubicacion. Used by validation-engine.
 */
export function findApplicableCatalogItem(
  catalogType: CatalogType,
  nombreMatch: string,
  ubicacionMatch: string
): CatalogItem | undefined {
  const candidates = catalogItemsRepo
    .getAll()
    .filter((i) => i.catalogType === catalogType && i.activo);

  return candidates.find(
    (i) =>
      i.nombre.toLowerCase().includes(nombreMatch.toLowerCase()) &&
      i.ubicacion.toLowerCase().includes(ubicacionMatch.toLowerCase())
  );
}
