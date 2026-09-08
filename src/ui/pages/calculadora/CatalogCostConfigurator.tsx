import { useMemo, useState } from "react";
import { Button } from "../../components/Button";
import { FieldWrap, SelectInput, TextInput } from "../../components/Field";
import {
  conceptosPorTipo,
  opcionPorId,
  opcionesPorConcepto,
  type CatalogoCotizacionTipo,
} from "../../../data/catalogos-cotizacion";

export interface SeleccionCostoCatalogo {
  id: string;
  tipo: CatalogoCotizacionTipo;
  concepto: string;
  opcionId: string;
  nombre: string;
  precioMensual: number;
  especificacion?: string;
  requiereValidacion: boolean;
}

interface Props {
  tipo: CatalogoCotizacionTipo;
  titulo: string;
  selecciones: SeleccionCostoCatalogo[];
  onChange: (items: SeleccionCostoCatalogo[]) => void;
}

function labelAgregar(tipo: CatalogoCotizacionTipo) {
  if (tipo === "EQUIPO") return "+ Agregar equipo";
  if (tipo === "UNIFORME") return "+ Agregar uniforme";
  return "+ Agregar vehículo";
}

export function CatalogCostConfigurator({ tipo, titulo, selecciones, onChange }: Props) {
  const conceptos = useMemo(() => conceptosPorTipo(tipo), [tipo]);
  const [concepto, setConcepto] = useState(conceptos[0] ?? "");
  const opciones = useMemo(() => opcionesPorConcepto(tipo, concepto), [tipo, concepto]);
  const [opcionId, setOpcionId] = useState(opciones[0]?.id ?? "");
  const [especificacion, setEspecificacion] = useState("");
  const [precioEstimado, setPrecioEstimado] = useState(0);

  const opcion = opcionPorId(opcionId);
  const manual = !opcion || opcion.requiereValidacion || opcion.precioMensual === null;

  function handleConcepto(next: string) {
    setConcepto(next);
    const first = opcionesPorConcepto(tipo, next)[0];
    setOpcionId(first?.id ?? "");
    setEspecificacion("");
    setPrecioEstimado(0);
  }

  function agregar() {
    const selected = opcionPorId(opcionId);
    if (!selected) return;
    const precio = selected.precioMensual ?? precioEstimado;
    if (manual && (!especificacion.trim() || precio <= 0)) return;

    onChange([
      ...selecciones,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tipo,
        concepto,
        opcionId: selected.id,
        nombre: manual ? especificacion.trim() : selected.nombre,
        precioMensual: precio,
        especificacion: manual ? especificacion.trim() : undefined,
        requiereValidacion: manual,
      },
    ]);
    setEspecificacion("");
    setPrecioEstimado(0);
  }

  const total = selecciones.reduce((acc, x) => acc + x.precioMensual, 0);

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-900">{titulo}</p>
          <p className="text-xs text-ink-500">Selecciona conceptos del catálogo. Los conceptos especiales pasan a validación de Pricing.</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-ink-400">Total mensual</p>
          <p className="text-sm font-semibold text-ink-900">${total.toLocaleString("es-MX")}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <FieldWrap label="Concepto">
          <SelectInput value={concepto} onChange={(e) => handleConcepto(e.target.value)}>
            {conceptos.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectInput>
        </FieldWrap>
        <FieldWrap label="Opción de catálogo">
          <SelectInput value={opcionId} onChange={(e) => { setOpcionId(e.target.value); setEspecificacion(""); setPrecioEstimado(0); }}>
            {opcionesPorConcepto(tipo, concepto).map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}{o.precioMensual !== null ? ` · $${o.precioMensual.toLocaleString("es-MX")}/mes` : ""}
              </option>
            ))}
          </SelectInput>
        </FieldWrap>
        <div className="flex items-end"><Button className="w-full" variant="secondary" onClick={agregar}>{labelAgregar(tipo)}</Button></div>
      </div>

      {manual && (
        <div className="mt-3 rounded-lg border border-warning-200 bg-warning-50 p-3">
          <p className="text-xs font-semibold text-warning-800">Pendiente de validación por Pricing</p>
          <p className="mt-1 text-[11px] text-warning-700">Especifica el requerimiento y un precio estimado. La cotización puede continuar, pero Jorge/Pricing deberá aceptar, rechazar o ajustar este concepto.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FieldWrap label="Especifique">
              <TextInput value={especificacion} onChange={(e) => setEspecificacion(e.target.value)} placeholder="Ej. Lámpara táctica recargable 1200 lúmenes" />
            </FieldWrap>
            <FieldWrap label="Precio estimado mensual (MXN)">
              <TextInput type="number" min={0} value={precioEstimado || ""} onChange={(e) => setPrecioEstimado(Number(e.target.value))} />
            </FieldWrap>
          </div>
        </div>
      )}

      {selecciones.length > 0 && (
        <div className="mt-4 divide-y divide-ink-100 rounded-lg border border-ink-100">
          {selecciones.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-ink-900">{x.concepto} · {x.nombre}</p>
                <p className="text-xs text-ink-500">${x.precioMensual.toLocaleString("es-MX")}/mes {x.requiereValidacion ? "· Pendiente de validación" : "· Catálogo autorizado"}</p>
              </div>
              <button className="text-xs font-medium text-danger-600 hover:underline" onClick={() => onChange(selecciones.filter((s) => s.id !== x.id))}>Quitar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
