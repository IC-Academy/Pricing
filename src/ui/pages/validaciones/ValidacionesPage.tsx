import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { canResolveExceptions } from "../../../modules/auth/roles";
import {
  acceptException,
  convertExceptionToParameter,
  listExceptions,
  rejectException,
  requestAdjustment,
} from "../../../modules/validation-engine";
import type { ExceptionStatus, ValidationException } from "../../../types";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Drawer";
import { SelectInput, TextArea } from "../../components/Field";
import { ExceptionStatusBadge } from "../../components/StatusBadge";
import { formatCurrency, formatDateTimeEs, formatPercent } from "../../../lib/ids";
import { useToast } from "../../../state/ToastContext";

type ActionType = "ACEPTAR" | "RECHAZAR" | "AJUSTE" | "CONVERTIR";

const ACTION_LABEL: Record<ActionType, string> = {
  ACEPTAR: "Aceptar excepción",
  RECHAZAR: "Rechazar excepción",
  AJUSTE: "Solicitar ajuste",
  CONVERTIR: "Convertir en nuevo parámetro",
};

export function ValidacionesPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | "TODOS">("PENDIENTE");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionModal, setActionModal] = useState<{ exception: ValidationException; type: ActionType } | null>(null);
  const [comentario, setComentario] = useState("");

  const exceptions = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshKey;
    let list = listExceptions();
    if (statusFilter !== "TODOS") list = list.filter((e) => e.status === statusFilter);
    return list;
  }, [statusFilter, refreshKey]);

  if (!currentUser) return null;
  const canResolve = canResolveExceptions(currentUser);

  function openAction(exception: ValidationException, type: ActionType) {
    setComentario("");
    setActionModal({ exception, type });
  }

  function confirmAction() {
    if (!actionModal || !currentUser) return;
    const { exception, type } = actionModal;

    if ((type === "ACEPTAR" || type === "CONVERTIR") && comentario.trim().length === 0) {
      showToast("Se requiere un comentario para esta acción.", "danger");
      return;
    }

    if (type === "ACEPTAR") acceptException(exception.id, comentario, currentUser.fullName);
    if (type === "RECHAZAR") rejectException(exception.id, comentario, currentUser.fullName);
    if (type === "AJUSTE") requestAdjustment(exception.id, comentario, currentUser.fullName);
    if (type === "CONVERTIR") convertExceptionToParameter(exception.id, comentario, currentUser.fullName);

    showToast(`${ACTION_LABEL[type]} aplicado correctamente.`);
    setActionModal(null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Centro de Validaciones</h2>
        <p className="text-sm text-ink-500">
          Cotizaciones con valores capturados fuera del parámetro autorizado en los catálogos.
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-3 border-b border-ink-200 px-5 py-3">
          <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ExceptionStatus | "TODOS")} className="max-w-56">
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ACEPTADA">Aceptada</option>
            <option value="RECHAZADA">Rechazada</option>
            <option value="AJUSTE_SOLICITADO">Ajuste solicitado</option>
            <option value="CONVERTIDA_A_PARAMETRO">Convertida a parámetro</option>
          </SelectInput>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Cotización</th>
                <th className="px-5 py-2.5 font-medium">Cliente</th>
                <th className="px-5 py-2.5 font-medium">Vendedor</th>
                <th className="px-5 py-2.5 font-medium">Campo</th>
                <th className="px-5 py-2.5 font-medium">Capturado</th>
                <th className="px-5 py-2.5 font-medium">Esperado</th>
                <th className="px-5 py-2.5 font-medium">Diferencia</th>
                <th className="px-5 py-2.5 font-medium">Fecha</th>
                <th className="px-5 py-2.5 font-medium">Estado</th>
                {canResolve && <th className="px-5 py-2.5 font-medium text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {exceptions.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-2.5">
                    <Link to={`/cotizaciones/${e.quotationId}`} className="font-medium text-brand-700 hover:underline">
                      {e.quotationFolio}
                    </Link>
                  </td>
                  <td className="px-5 py-2.5 text-ink-800">{e.clienteNombre}</td>
                  <td className="px-5 py-2.5 text-ink-600">{e.vendedorNombre}</td>
                  <td className="px-5 py-2.5 text-ink-600">{e.campo}</td>
                  <td className="px-5 py-2.5 font-medium text-ink-900">{formatCurrency(e.valorCapturado)}</td>
                  <td className="px-5 py-2.5 text-ink-600">
                    {formatCurrency(e.valorEsperadoMin)}–{formatCurrency(e.valorEsperadoMax)}
                  </td>
                  <td className="px-5 py-2.5 text-ink-600">
                    {formatCurrency(e.diferenciaAbsoluta)} ({formatPercent(e.diferenciaPorcentual)})
                  </td>
                  <td className="px-5 py-2.5 text-ink-600">{formatDateTimeEs(e.fecha)}</td>
                  <td className="px-5 py-2.5">
                    <ExceptionStatusBadge status={e.status} />
                  </td>
                  {canResolve && (
                    <td className="px-5 py-2.5">
                      {e.status === "PENDIENTE" ? (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button size="sm" onClick={() => openAction(e, "ACEPTAR")}>
                            Aceptar
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => openAction(e, "AJUSTE")}>
                            Ajuste
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => openAction(e, "CONVERTIR")}>
                            Convertir
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => openAction(e, "RECHAZAR")}>
                            Rechazar
                          </Button>
                        </div>
                      ) : (
                        <p className="text-right text-xs text-ink-400">{e.resueltoPor}</p>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {exceptions.length === 0 && (
                <tr>
                  <td colSpan={canResolve ? 10 : 9} className="px-5 py-8 text-center text-xs text-ink-500">
                    No hay excepciones con este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal ? ACTION_LABEL[actionModal.type] : ""}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setActionModal(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmAction}>Confirmar</Button>
          </div>
        }
      >
        {actionModal && (
          <div className="space-y-3 text-sm">
            <p className="text-ink-700">
              <span className="font-medium">{actionModal.exception.campo}</span> — {actionModal.exception.quotationFolio}
            </p>
            <p className="text-xs text-ink-500">
              Valor capturado {formatCurrency(actionModal.exception.valorCapturado)} · Rango autorizado{" "}
              {formatCurrency(actionModal.exception.valorEsperadoMin)}–{formatCurrency(actionModal.exception.valorEsperadoMax)}
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">
                Comentario {(actionModal.type === "ACEPTAR" || actionModal.type === "CONVERTIR") && "(requerido)"}
              </span>
              <TextArea rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
