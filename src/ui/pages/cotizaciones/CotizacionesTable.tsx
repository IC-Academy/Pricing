import { Link } from "react-router-dom";
import type { Quotation } from "../../../types";
import { QuotationStatusBadge } from "../../components/StatusBadge";
import { formatCurrency, formatDateEs } from "../../../lib/ids";

export function CotizacionesTable({ quotations }: { quotations: Quotation[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-5 py-2.5 font-medium">Folio</th>
            <th className="px-5 py-2.5 font-medium">Cliente</th>
            <th className="px-5 py-2.5 font-medium">Vendedor</th>
            <th className="px-5 py-2.5 font-medium">Ciudad</th>
            <th className="px-5 py-2.5 font-medium">Fecha</th>
            <th className="px-5 py-2.5 font-medium">Precio mensual</th>
            <th className="px-5 py-2.5 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {quotations.map((q) => (
            <tr key={q.id} className="cursor-pointer hover:bg-ink-50">
              <td className="px-5 py-2.5">
                <Link to={`/cotizaciones/${q.id}`} className="font-medium text-brand-700 hover:underline">
                  {q.folio}
                </Link>
              </td>
              <td className="px-5 py-2.5 text-ink-800">{q.datosGenerales.cliente}</td>
              <td className="px-5 py-2.5 text-ink-600">{q.datosGenerales.vendedorNombre}</td>
              <td className="px-5 py-2.5 text-ink-600">{q.datosGenerales.ciudad}</td>
              <td className="px-5 py-2.5 text-ink-600">{formatDateEs(q.datosGenerales.fecha)}</td>
              <td className="px-5 py-2.5 text-ink-600">{formatCurrency(q.resultado?.precioMensualTotal)}</td>
              <td className="px-5 py-2.5">
                <QuotationStatusBadge status={q.status} />
              </td>
            </tr>
          ))}
          {quotations.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-xs text-ink-500">
                No hay cotizaciones que coincidan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
