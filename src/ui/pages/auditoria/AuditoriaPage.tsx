import { useMemo, useState } from "react";
import { listAuditLog } from "../../../modules/audit-service";
import type { AuditEntity } from "../../../types";
import { Card } from "../../components/Card";
import { SelectInput, TextInput } from "../../components/Field";
import { formatDateTimeEs } from "../../../lib/ids";

const ENTITY_LABEL: Record<AuditEntity, string> = {
  CATALOGO: "Catálogo",
  PARAMETRO: "Parámetro",
  USUARIO: "Usuario",
  PERMISO: "Permiso",
  EXCEPCION: "Excepción",
  COTIZACION: "Cotización",
};

export function AuditoriaPage() {
  const [entidad, setEntidad] = useState<AuditEntity | "TODOS">("TODOS");
  const [search, setSearch] = useState("");

  const entries = useMemo(() => {
    let list = listAuditLog(entidad === "TODOS" ? undefined : { entidad });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.descripcion.toLowerCase().includes(q) || e.usuario.toLowerCase().includes(q));
    }
    return list;
  }, [entidad, search]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Auditoría</h2>
        <p className="text-sm text-ink-500">Historial de cambios en catálogos, parámetros, usuarios, permisos y excepciones.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-200 px-5 py-3">
          <TextInput placeholder="Buscar por descripción o usuario…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <SelectInput value={entidad} onChange={(e) => setEntidad(e.target.value as AuditEntity | "TODOS")} className="max-w-56">
            <option value="TODOS">Todas las entidades</option>
            {Object.entries(ENTITY_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="divide-y divide-ink-100">
          {entries.map((e) => (
            <div key={e.id} className="px-5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">{ENTITY_LABEL[e.entidad]}</span>
                  <p className="text-sm text-ink-900">{e.descripcion}</p>
                </div>
                <p className="text-xs text-ink-400">{formatDateTimeEs(e.fecha)}</p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                <span>
                  Usuario: <span className="font-medium text-ink-700">{e.usuario}</span>
                </span>
                {e.valorAnterior && (
                  <span>
                    Anterior: <span className="text-danger-600">{e.valorAnterior}</span>
                  </span>
                )}
                {e.valorNuevo && (
                  <span>
                    Nuevo: <span className="text-success-600">{e.valorNuevo}</span>
                  </span>
                )}
                {e.comentario && <span className="italic">"{e.comentario}"</span>}
              </div>
            </div>
          ))}
          {entries.length === 0 && <p className="px-5 py-8 text-center text-xs text-ink-500">Sin registros de auditoría.</p>}
        </div>
      </Card>
    </div>
  );
}
