import { useMemo, useState } from "react";
import { useAuth } from "../../../modules/auth/AuthContext";
import { canEditCatalog } from "../../../modules/auth/roles";
import { getVigenciaEstado, listCatalogItems, setCatalogItemActive } from "../../../modules/catalog-service";
import type { CatalogItem, CatalogType, VigenciaEstado } from "../../../types";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { TextInput, SelectInput } from "../../components/Field";
import { VigenciaBadge } from "../../components/VigenciaBadge";
import { formatCurrency, formatDateEs, formatDateTimeEs } from "../../../lib/ids";
import { CatalogFormDrawer } from "./CatalogFormDrawer";
import { CatalogHistoryModal } from "./CatalogHistoryModal";
import { useToast } from "../../../state/ToastContext";

const TYPES: { type: CatalogType; label: string }[] = [
  { type: "SALARIOS", label: "Salarios" },
  { type: "IMPUESTOS", label: "Impuestos" },
  { type: "UNIFORMES", label: "Uniformes" },
  { type: "VEHICULOS", label: "Vehículos" },
  { type: "EQUIPAMIENTO", label: "Equipamiento" },
];

export function CatalogosPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [activeType, setActiveType] = useState<CatalogType>("SALARIOS");
  const [search, setSearch] = useState("");
  const [vigenciaFilter, setVigenciaFilter] = useState<VigenciaEstado | "TODOS">("TODOS");
  const [showInactive, setShowInactive] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [historyItem, setHistoryItem] = useState<CatalogItem | null>(null);

  if (!currentUser) return null;
  const canEdit = canEditCatalog(currentUser, activeType);

  const items = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshKey;
    let list = listCatalogItems(activeType);
    if (!showInactive) list = list.filter((i) => i.activo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.nombre.toLowerCase().includes(q) || i.ubicacion.toLowerCase().includes(q));
    }
    if (vigenciaFilter !== "TODOS") {
      list = list.filter((i) => getVigenciaEstado(i) === vigenciaFilter);
    }
    return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [activeType, search, vigenciaFilter, showInactive, refreshKey]);

  const mostRecienteActualizacion = useMemo(() => {
    const all = listCatalogItems(activeType);
    if (all.length === 0) return undefined;
    return all.reduce((latest, i) => (i.ultimaActualizacion > latest ? i.ultimaActualizacion : latest), all[0].ultimaActualizacion);
  }, [activeType, refreshKey]);

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  function handleToggleActive(item: CatalogItem) {
    if (!currentUser) return;
    setCatalogItemActive(item.id, !item.activo, currentUser.fullName);
    showToast(item.activo ? "Registro desactivado." : "Registro reactivado.");
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-200 pb-1">
        {TYPES.map((t) => (
          <button
            key={t.type}
            onClick={() => setActiveType(t.type)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium ${
              activeType === t.type
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-ink-500 hover:text-ink-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-600">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>
              <span className="font-medium text-ink-800">Última actualización: </span>
              {mostRecienteActualizacion ? formatDateTimeEs(mostRecienteActualizacion) : "—"}
            </span>
            <span>
              <span className="font-medium text-ink-800">Registros: </span>
              {items.length}
            </span>
            <span>
              <span className="font-medium text-ink-800">Responsable general: </span>
              Pricing
            </span>
          </div>
          {canEdit ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDrawerOpen(true);
              }}
            >
              + Nuevo registro
            </Button>
          ) : (
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-500">Solo lectura para tu rol</span>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-200 px-5 py-3">
          <TextInput
            placeholder="Buscar por nombre o ubicación…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <SelectInput value={vigenciaFilter} onChange={(e) => setVigenciaFilter(e.target.value as VigenciaEstado | "TODOS")} className="max-w-52">
            <option value="TODOS">Todos los estados</option>
            <option value="VIGENTE">Vigente</option>
            <option value="PROXIMO_A_VENCER">Próximo a vencer</option>
            <option value="VENCIDO">Vencido</option>
            <option value="SIN_VIGENCIA">Sin vigencia</option>
          </SelectInput>
          <label className="flex items-center gap-1.5 text-xs text-ink-600">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Mostrar inactivos
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Nombre</th>
                <th className="px-5 py-2.5 font-medium">Ubicación</th>
                <th className="px-5 py-2.5 font-medium">Valor</th>
                <th className="px-5 py-2.5 font-medium">Vigencia</th>
                <th className="px-5 py-2.5 font-medium">Vencimiento</th>
                <th className="px-5 py-2.5 font-medium">Responsable</th>
                <th className="px-5 py-2.5 font-medium">Última actualización</th>
                <th className="px-5 py-2.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((item) => (
                <tr key={item.id} className={item.activo ? "" : "opacity-50"}>
                  <td className="px-5 py-2.5 font-medium text-ink-900">{item.nombre}</td>
                  <td className="px-5 py-2.5 text-ink-600">{item.ubicacion}</td>
                  <td className="px-5 py-2.5 text-ink-600">
                    {item.unidad === "%" ? `${item.valor}%` : formatCurrency(item.valor)}
                    {item.valorMin !== undefined && item.valorMax !== undefined && (
                      <span className="ml-1 text-[11px] text-ink-400">
                        ({formatCurrency(item.valorMin)}–{formatCurrency(item.valorMax)})
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2.5">
                    <VigenciaBadge estado={getVigenciaEstado(item)} />
                  </td>
                  <td className="px-5 py-2.5 text-ink-600">{formatDateEs(item.fechaVencimiento)}</td>
                  <td className="px-5 py-2.5 text-ink-600">{item.responsable}</td>
                  <td className="px-5 py-2.5 text-ink-600">{formatDateTimeEs(item.ultimaActualizacion)}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setHistoryItem(item)}>
                        Historial
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditing(item);
                              setDrawerOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                          <Button size="sm" variant={item.activo ? "danger" : "primary"} onClick={() => handleToggleActive(item)}>
                            {item.activo ? "Desactivar" : "Activar"}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-xs text-ink-500">
                    No hay registros que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CatalogFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        catalogType={activeType}
        editing={editing}
        onSaved={reload}
      />
      <CatalogHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />
    </div>
  );
}
