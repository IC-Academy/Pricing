import { Modal } from "../../components/Drawer";
import { getCatalogHistory } from "../../../modules/catalog-service";
import { formatDateTimeEs } from "../../../lib/ids";
import type { CatalogItem } from "../../../types";

export function CatalogHistoryModal({ item, onClose }: { item: CatalogItem | null; onClose: () => void }) {
  if (!item) return null;
  const history = getCatalogHistory(item.id);

  return (
    <Modal open={!!item} onClose={onClose} title={`Historial de cambios · ${item.nombre}`} widthClass="max-w-lg">
      <div className="mb-3 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">
        <p>
          <span className="font-medium text-ink-800">Última actualización:</span> {formatDateTimeEs(item.ultimaActualizacion)}
        </p>
        <p>
          <span className="font-medium text-ink-800">Vigencia:</span> {formatDateTimeEs(item.fechaInicio)} —{" "}
          {formatDateTimeEs(item.fechaVencimiento)}
        </p>
        <p>
          <span className="font-medium text-ink-800">Responsable:</span> {item.responsable}
        </p>
      </div>

      {history.length === 0 && <p className="py-6 text-center text-xs text-ink-500">Sin cambios registrados todavía.</p>}

      <ul className="space-y-3">
        {history.map((h) => (
          <li key={h.id} className="rounded-md border border-ink-200 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-900">{h.usuario}</p>
              <p className="text-[11px] text-ink-400">{formatDateTimeEs(h.fecha)}</p>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              {Object.keys(h.campoNuevo).length === 0 && <p className="text-ink-500">Sin cambios de campo detectados.</p>}
              {Object.entries(h.campoNuevo).map(([key, newVal]) => (
                <p key={key}>
                  <span className="font-medium text-ink-700">{key}:</span>{" "}
                  <span className="text-danger-600 line-through">{String(h.campoAnterior[key] ?? "—")}</span>{" "}
                  <span className="text-success-600">→ {String(newVal)}</span>
                </p>
              ))}
            </div>
            {h.comentario && <p className="mt-2 text-xs italic text-ink-500">"{h.comentario}"</p>}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
