// ============================================================================
// audit-service
// ----------------------------------------------------------------------------
// Single write path for the audit trail. Any module that mutates a catalog,
// parameter, user, permission set, exception or quotation should call
// recordAuditEntry() so every change is traceable — never write to
// auditLogRepo directly from UI code.
// ============================================================================

import { auditLogRepo } from "../../data/db";
import { newId, nowIso } from "../../lib/ids";
import type { AuditEntity, AuditLogEntry } from "../../types";

export interface RecordAuditInput {
  entidad: AuditEntity;
  entidadId: string;
  descripcion: string;
  valorAnterior?: string;
  valorNuevo?: string;
  usuario: string;
  comentario?: string;
}

export function recordAuditEntry(input: RecordAuditInput): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: newId(),
    fecha: nowIso(),
    ...input,
  };
  auditLogRepo.create(entry);
  return entry;
}

export function listAuditLog(filter?: { entidad?: AuditEntity; usuario?: string }): AuditLogEntry[] {
  let all = auditLogRepo.getAll().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  if (filter?.entidad) all = all.filter((e) => e.entidad === filter.entidad);
  if (filter?.usuario) all = all.filter((e) => e.usuario === filter.usuario);
  return all;
}
