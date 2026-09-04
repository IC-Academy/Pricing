import { benchmarkRepo, catalogItemsRepo } from "../../../data/db";
import { computeVigenciaEstado } from "../../../lib/vigencia";
import { Card, CardHeader } from "../../components/Card";
import { VigenciaBadge } from "../../components/VigenciaBadge";
import { formatCurrency, formatDateEs } from "../../../lib/ids";

export function BenchmarkPage() {
  const entries = benchmarkRepo.getAll();
  const salarios = catalogItemsRepo.getAll().filter((c) => c.catalogType === "SALARIOS");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Benchmark de mercado"
          subtitle="Comparativo de tarifas de mercado vs. el rango salarial autorizado en el Price Model."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Puesto</th>
                <th className="px-5 py-2.5 font-medium">Ciudad</th>
                <th className="px-5 py-2.5 font-medium">Rango interno (salario)</th>
                <th className="px-5 py-2.5 font-medium">Tarifa de mercado</th>
                <th className="px-5 py-2.5 font-medium">Fuente</th>
                <th className="px-5 py-2.5 font-medium">Vigencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {entries.map((b) => {
                const interno = salarios.find((s) => s.nombre === b.puesto && s.ubicacion === b.ciudad);
                return (
                  <tr key={b.id}>
                    <td className="px-5 py-2.5 font-medium text-ink-900">{b.puesto}</td>
                    <td className="px-5 py-2.5 text-ink-600">{b.ciudad}</td>
                    <td className="px-5 py-2.5 text-ink-600">
                      {interno && interno.valorMin !== undefined && interno.valorMax !== undefined
                        ? `${formatCurrency(interno.valorMin)} – ${formatCurrency(interno.valorMax)}`
                        : "—"}
                    </td>
                    <td className="px-5 py-2.5 font-medium text-brand-700">{formatCurrency(b.tarifaMercadoMensual)}</td>
                    <td className="px-5 py-2.5 text-ink-600">{b.fuente}</td>
                    <td className="px-5 py-2.5">
                      <VigenciaBadge estado={computeVigenciaEstado(b)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="px-5 py-4">
        <p className="text-xs text-ink-500">
          Última actualización de benchmark: {entries[0] ? formatDateEs(entries[0].fechaActualizacion) : "—"}. Los
          datos de benchmark alimentan la sección "Salud del Price Model" en el Dashboard.
        </p>
      </Card>
    </div>
  );
}
