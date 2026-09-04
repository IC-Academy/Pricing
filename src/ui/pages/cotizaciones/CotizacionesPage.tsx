import { useMemo, useState } from "react";
import { listQuotations } from "../../../modules/quotation-service";
import type { QuotationStatus } from "../../../types";
import { Card } from "../../components/Card";
import { TextInput, SelectInput } from "../../components/Field";
import { CotizacionesTable } from "./CotizacionesTable";

const STATUSES: QuotationStatus[] = ["BORRADOR", "CALCULADA", "PENDIENTE_VALIDACION", "VALIDADA", "PROPUESTA_GENERADA", "CANCELADA"];

export function CotizacionesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuotationStatus | "TODOS">("TODOS");

  const quotations = useMemo(() => {
    let list = listQuotations();
    if (status !== "TODOS") list = list.filter((q) => q.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.folio.toLowerCase().includes(q) ||
          item.datosGenerales.cliente.toLowerCase().includes(q) ||
          item.datosGenerales.vendedorNombre.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, status]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Cotizaciones</h2>
        <p className="text-sm text-ink-500">Histórico completo de cotizaciones generadas en la plataforma.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-200 px-5 py-3">
          <TextInput placeholder="Buscar por folio, cliente o vendedor…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value as QuotationStatus | "TODOS")} className="max-w-56">
            <option value="TODOS">Todos los estados</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </SelectInput>
        </div>
        <CotizacionesTable quotations={quotations} />
      </Card>
    </div>
  );
}
