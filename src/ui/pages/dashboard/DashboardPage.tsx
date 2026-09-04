import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { catalogItemsRepo, exceptionsRepo, quotationsRepo, benchmarkRepo, globalConfigStore } from "../../../data/db";
import { countByVigencia, getVigenciaEstado } from "../../../modules/catalog-service";
import { computeVigenciaEstado } from "../../../lib/vigencia";
import { Card, CardHeader, StatCard } from "../../components/Card";
import { VigenciaBadge } from "../../components/VigenciaBadge";
import { QuotationStatusBadge } from "../../components/StatusBadge";
import { formatDateEs, formatDateTimeEs } from "../../../lib/ids";
import type { CatalogType } from "../../../types";

const CATALOG_LABELS: Record<CatalogType, string> = {
  SALARIOS: "Salarios",
  IMPUESTOS: "Impuestos",
  UNIFORMES: "Uniformes",
  VEHICULOS: "Vehículos",
  EQUIPAMIENTO: "Equipamiento",
};

export function DashboardPage() {
  const { currentUser } = useAuth();
  const today = new Date();

  const catalogItems = catalogItemsRepo.getAll();
  const quotations = quotationsRepo.getAll();
  const exceptions = exceptionsRepo.getAll();
  const benchmark = benchmarkRepo.getAll();
  const globalConfig = globalConfigStore.get();

  const counts = useMemo(() => countByVigencia(catalogItems, today), [catalogItems]);
  const pendingExceptions = exceptions.filter((e) => e.status === "PENDIENTE").length;

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const quotationsThisMonth = quotations.filter((q) => new Date(q.createdAt) >= startOfMonth).length;

  // Salud del Price Model: worst vigencia state per catalog type + benchmark.
  const healthRows = (Object.keys(CATALOG_LABELS) as CatalogType[]).map((type) => {
    const items = catalogItems.filter((i) => i.catalogType === type && i.activo);
    const worst = worstEstado(items.map((i) => getVigenciaEstado(i, today)));
    return { label: CATALOG_LABELS[type], estado: worst };
  });
  const benchmarkWorst = worstEstado(benchmark.filter((b) => b.activo).map((b) => computeVigenciaEstado(b, today)));
  healthRows.push({ label: "Benchmark", estado: benchmarkWorst });

  const recentQuotations = [...quotations]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Hola, {currentUser?.fullName.split(" ")[0]}</h2>
        <p className="text-sm text-ink-500">Resumen general del Price Model y la operación de Pricing.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Catálogos vigentes" value={counts.VIGENTE} tone="success" />
        <StatCard label="Próximos a vencer" value={counts.PROXIMO_A_VENCER} tone="warning" />
        <StatCard label="Catálogos vencidos" value={counts.VENCIDO} tone="danger" />
        <StatCard label="Validaciones pendientes" value={pendingExceptions} tone="brand" />
        <StatCard label="Cotizaciones del mes" value={quotationsThisMonth} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Salud del Price Model"
            subtitle={`Última actualización general: ${formatDateTimeEs(globalConfig.ultimaActualizacionModelo)}`}
          />
          <div className="divide-y divide-ink-100">
            {healthRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-ink-800">{row.label}</span>
                <VigenciaBadge estado={row.estado} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Cotizaciones recientes" action={<Link to="/cotizaciones" className="text-xs font-medium text-brand-600 hover:underline">Ver todas</Link>} />
          <div className="divide-y divide-ink-100">
            {recentQuotations.map((q) => (
              <Link
                key={q.id}
                to={`/cotizaciones/${q.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-ink-50"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">{q.folio}</p>
                  <p className="text-xs text-ink-500">{q.datosGenerales.cliente}</p>
                </div>
                <QuotationStatusBadge status={q.status} />
              </Link>
            ))}
            {recentQuotations.length === 0 && <p className="px-5 py-6 text-center text-xs text-ink-500">Sin cotizaciones aún.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Catálogos que requieren atención" subtitle="Próximos a vencer o vencidos" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Catálogo</th>
                <th className="px-5 py-2.5 font-medium">Ubicación</th>
                <th className="px-5 py-2.5 font-medium">Vencimiento</th>
                <th className="px-5 py-2.5 font-medium">Responsable</th>
                <th className="px-5 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {catalogItems
                .filter((i) => {
                  const e = getVigenciaEstado(i, today);
                  return e === "PROXIMO_A_VENCER" || e === "VENCIDO";
                })
                .map((i) => (
                  <tr key={i.id}>
                    <td className="px-5 py-2.5">{i.nombre}</td>
                    <td className="px-5 py-2.5 text-ink-600">{i.ubicacion}</td>
                    <td className="px-5 py-2.5 text-ink-600">{formatDateEs(i.fechaVencimiento)}</td>
                    <td className="px-5 py-2.5 text-ink-600">{i.responsable}</td>
                    <td className="px-5 py-2.5">
                      <VigenciaBadge estado={getVigenciaEstado(i, today)} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function worstEstado(estados: ReturnType<typeof getVigenciaEstado>[]): ReturnType<typeof getVigenciaEstado> {
  if (estados.some((e) => e === "VENCIDO")) return "VENCIDO";
  if (estados.some((e) => e === "PROXIMO_A_VENCER")) return "PROXIMO_A_VENCER";
  if (estados.every((e) => e === "SIN_VIGENCIA") || estados.length === 0) return estados.length === 0 ? "SIN_VIGENCIA" : "SIN_VIGENCIA";
  if (estados.some((e) => e === "VIGENTE")) return "VIGENTE";
  return "SIN_VIGENCIA";
}

// exported for reuse (e.g. quotations list "actualmente saludable" hints)
export { CATALOG_LABELS };
