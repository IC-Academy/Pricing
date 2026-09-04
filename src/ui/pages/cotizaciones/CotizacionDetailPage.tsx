import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { isAdminLike } from "../../../modules/auth/roles";
import { finalizeDraft, getQuotation, setQuotationStatus } from "../../../modules/quotation-service";
import { exceptionsRepo } from "../../../data/db";
import { Card, CardHeader } from "../../components/Card";
import { Button } from "../../components/Button";
import { QuotationStatusBadge, ExceptionStatusBadge } from "../../components/StatusBadge";
import { formatCurrency, formatDateEs, formatDateTimeEs, formatPercent } from "../../../lib/ids";
import { useToast } from "../../../state/ToastContext";

export function CotizacionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const quotation = useMemo(() => (id ? getQuotation(id) : undefined), [id, refreshKey]);
  const exceptions = useMemo(() => (quotation ? exceptionsRepo.getAll().filter((e) => quotation.exceptionIds.includes(e.id)) : []), [quotation, refreshKey]);

  if (!currentUser) return null;

  if (!quotation) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <p className="text-sm text-ink-600">No se encontró la cotización solicitada.</p>
        <Link to="/cotizaciones" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
          Volver a Cotizaciones
        </Link>
      </Card>
    );
  }

  const allExceptionsResolved = exceptions.length === 0 || exceptions.every((e) => e.status !== "PENDIENTE");
  const canValidate = isAdminLike(currentUser.role) || currentUser.role === "PRICING";
  const canGenerateProposal =
    (quotation.status === "CALCULADA" || quotation.status === "VALIDADA") && allExceptionsResolved;

  function handleCalcular() {
    if (!quotation) return;
    const updated = finalizeDraft(quotation.id);
    if (updated?.status === "PENDIENTE_VALIDACION") {
      showToast("Se detectaron valores fuera de parámetro. Excepción enviada a Pricing.", "warning");
    } else {
      showToast("Cotización calculada.", "success");
    }
    setRefreshKey((k) => k + 1);
  }

  function handleMarkValidated() {
    if (!quotation) return;
    setQuotationStatus(quotation.id, "VALIDADA", currentUser!.fullName);
    showToast("Cotización marcada como validada.", "success");
    setRefreshKey((k) => k + 1);
  }

  function handleCancelar() {
    if (!quotation) return;
    setQuotationStatus(quotation.id, "CANCELADA", currentUser!.fullName);
    showToast("Cotización cancelada.", "info");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-ink-900">{quotation.folio}</h2>
            <QuotationStatusBadge status={quotation.status} />
          </div>
          <p className="text-sm text-ink-500">
            {quotation.datosGenerales.cliente} · {quotation.datosGenerales.nombreOportunidad}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quotation.status === "BORRADOR" && (
            <Button onClick={handleCalcular}>Calcular cotización</Button>
          )}
          {canValidate && quotation.status === "CALCULADA" && (
            <Button variant="secondary" onClick={handleMarkValidated}>
              Marcar como validada
            </Button>
          )}
          {canGenerateProposal && (
            <Button
              onClick={() => {
                setQuotationStatus(quotation.id, "PROPUESTA_GENERADA", currentUser.fullName);
                navigate(`/propuesta/${quotation.id}`);
              }}
            >
              Generar propuesta
            </Button>
          )}
          {quotation.status === "PROPUESTA_GENERADA" && (
            <Link to={`/propuesta/${quotation.id}`}>
              <Button variant="secondary">Ver propuesta</Button>
            </Link>
          )}
          {quotation.status !== "CANCELADA" && quotation.status !== "PROPUESTA_GENERADA" && (
            <Button variant="ghost" onClick={handleCancelar}>
              Cancelar cotización
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Datos generales" />
          <div className="grid grid-cols-2 gap-4 px-5 py-4 text-sm sm:grid-cols-3">
            <Info label="Cliente" value={quotation.datosGenerales.cliente} />
            <Info label="Oportunidad" value={quotation.datosGenerales.nombreOportunidad} />
            <Info label="Ciudad" value={quotation.datosGenerales.ciudad} />
            <Info label="Estado" value={quotation.datosGenerales.estado} />
            <Info label="Fecha" value={formatDateEs(quotation.datosGenerales.fecha)} />
            <Info label="Vendedor" value={quotation.datosGenerales.vendedorNombre} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Parámetros comerciales" />
          <div className="space-y-2 px-5 py-4 text-sm">
            <Info label="Gross margin objetivo" value={formatPercent(quotation.parametrosComerciales.grossMarginObjetivo)} />
            <Info label="Vigencia de propuesta" value={`${quotation.parametrosComerciales.vigenciaPropuestaDias} días`} />
            {quotation.parametrosComerciales.observaciones && (
              <Info label="Observaciones" value={quotation.parametrosComerciales.observaciones} />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Puestos cotizados" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Puesto</th>
                <th className="px-5 py-2.5 font-medium">Cant.</th>
                <th className="px-5 py-2.5 font-medium">Cobertura</th>
                <th className="px-5 py-2.5 font-medium">Salario</th>
                <th className="px-5 py-2.5 font-medium">Costo mensual</th>
                <th className="px-5 py-2.5 font-medium">Precio unitario</th>
                <th className="px-5 py-2.5 font-medium">Precio total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {(quotation.resultado?.puestos ?? quotation.puestos).map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-2.5 font-medium text-ink-900">{p.tipoPuesto}</td>
                  <td className="px-5 py-2.5 text-ink-600">{p.cantidadPosiciones}</td>
                  <td className="px-5 py-2.5 text-ink-600">{p.cobertura}</td>
                  <td className="px-5 py-2.5 text-ink-600">{formatCurrency(p.salarioMensual)}</td>
                  <td className="px-5 py-2.5 text-ink-600">
                    {"costoMensualTotal" in p ? formatCurrency((p as { costoMensualTotal: number }).costoMensualTotal) : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-ink-600">
                    {"precioRecomendadoUnitario" in p
                      ? formatCurrency((p as { precioRecomendadoUnitario: number }).precioRecomendadoUnitario)
                      : "—"}
                  </td>
                  <td className="px-5 py-2.5 font-medium text-ink-900">
                    {"precioTotalPuesto" in p ? formatCurrency((p as { precioTotalPuesto: number }).precioTotalPuesto) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            {quotation.resultado && (
              <tfoot>
                <tr className="border-t border-ink-200 bg-ink-50 font-semibold text-ink-900">
                  <td className="px-5 py-3" colSpan={4}>
                    Total
                  </td>
                  <td className="px-5 py-3">{formatCurrency(quotation.resultado.costoMensualTotal)}</td>
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3">{formatCurrency(quotation.resultado.precioMensualTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {exceptions.length > 0 && (
        <Card>
          <CardHeader title="Excepciones relacionadas" subtitle="Detectadas por el motor de validación al calcular esta cotización." />
          <div className="divide-y divide-ink-100">
            {exceptions.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">{e.campo}</p>
                  <p className="text-xs text-ink-500">
                    Capturado {formatCurrency(e.valorCapturado)} · Rango autorizado {formatCurrency(e.valorEsperadoMin)}–
                    {formatCurrency(e.valorEsperadoMax)}
                  </p>
                </div>
                <ExceptionStatusBadge status={e.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {quotation.parametrosSnapshot && (
        <Card className="px-5 py-3">
          <p className="text-xs text-ink-500">
            Parámetros congelados el {formatDateTimeEs(quotation.parametrosSnapshot.tomadoEl)}. Esta cotización no cambia
            aunque los catálogos se actualicen después.
          </p>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-0.5 text-ink-800">{value}</p>
    </div>
  );
}
