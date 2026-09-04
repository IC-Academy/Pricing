import { Link, useParams } from "react-router-dom";
import { getQuotation } from "../../../modules/quotation-service";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { formatCurrency, formatDateEs } from "../../../lib/ids";

export function PropuestaPage() {
  const { id } = useParams<{ id: string }>();
  const quotation = id ? getQuotation(id) : undefined;

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

  const vigenciaHasta = new Date(quotation.createdAt);
  vigenciaHasta.setDate(vigenciaHasta.getDate() + quotation.parametrosComerciales.vigenciaPropuestaDias);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link to={`/cotizaciones/${quotation.id}`} className="text-sm font-medium text-brand-600 hover:underline">
          ← Volver a la cotización
        </Link>
        <Button onClick={() => window.print()}>Imprimir / Guardar PDF</Button>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="mb-6 flex items-center justify-between border-b border-ink-200 pb-4">
          <div>
            <p className="text-lg font-semibold text-ink-900">Propuesta Económica Preliminar</p>
            <p className="text-sm text-ink-500">Folio {quotation.folio}</p>
          </div>
          <div className="text-right text-xs text-ink-500">
            <p>Inter-Con · EDD Pricing</p>
            <p>{formatDateEs(quotation.datosGenerales.fecha)}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Field label="Cliente" value={quotation.datosGenerales.cliente} />
          <Field label="Alcance" value={quotation.datosGenerales.nombreOportunidad} />
          <Field label="Ubicación" value={`${quotation.datosGenerales.ciudad}, ${quotation.datosGenerales.estado}`} />
          <Field label="Cobertura" value={[...new Set(quotation.puestos.map((p) => p.cobertura))].join(", ")} />
          <Field label="Vigencia" value={`${formatDateEs(quotation.createdAt)} — ${formatDateEs(vigenciaHasta.toISOString())}`} />
          <Field label="Vendedor" value={quotation.datosGenerales.vendedorNombre} />
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Puestos propuestos</p>
        <table className="mb-6 w-full text-left text-sm">
          <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="py-2 font-medium">Puesto</th>
              <th className="py-2 font-medium">Cant.</th>
              <th className="py-2 font-medium">Cobertura</th>
              <th className="py-2 font-medium text-right">Precio por puesto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(quotation.resultado?.puestos ?? []).map((p) => (
              <tr key={p.id}>
                <td className="py-2">{p.tipoPuesto}</td>
                <td className="py-2">{p.cantidadPosiciones}</td>
                <td className="py-2">{p.cobertura}</td>
                <td className="py-2 text-right">{formatCurrency(p.precioRecomendadoUnitario)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-6 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Precio mensual total</span>
              <span className="font-semibold text-ink-900">{formatCurrency(quotation.resultado?.precioMensualTotal)}</span>
            </div>
          </div>
        </div>

        {quotation.parametrosComerciales.opcionales && (
          <div className="mb-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Opcionales</p>
            <p className="text-sm text-ink-700">{quotation.parametrosComerciales.opcionales}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">Supuestos</p>
          <ul className="list-inside list-disc text-sm text-ink-700">
            <li>Cálculo basado en los parámetros vigentes del Price Model a la fecha de la cotización.</li>
            <li>Incluye carga social, uniforme, equipo{quotation.puestos.some((p) => p.vehiculoOpcional) ? " y vehículo" : ""}.</li>
            <li>No incluye IVA.</li>
          </ul>
        </div>

        <div className="rounded-md border border-warning-500/40 bg-warning-50 p-4 text-xs text-warning-600">
          Esta propuesta económica es una estimación preliminar generada con base en los parámetros vigentes del Price
          Model y está sujeta a validación final por el área de Pricing.
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-0.5 text-ink-800">{value}</p>
    </div>
  );
}
