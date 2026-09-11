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
  /** Total mensual del concepto para el grupo/servicio, ya considerando cantidad. */
  precioMensual: number;
  cantidad: number;
  precioUnitario: number;
  entregasAnio?: number;
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

function round2(n:number){ return Math.round(n*100)/100; }

export function CatalogCostConfigurator({ tipo, titulo, selecciones, onChange }: Props) {
  const conceptos = useMemo(() => conceptosPorTipo(tipo), [tipo]);
  const [concepto, setConcepto] = useState(conceptos[0] ?? "");
  const opciones = useMemo(() => opcionesPorConcepto(tipo, concepto), [tipo, concepto]);
  const [opcionId, setOpcionId] = useState(opciones[0]?.id ?? "");
  const [especificacion, setEspecificacion] = useState("");
  const [precioEstimado, setPrecioEstimado] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [entregasAnio, setEntregasAnio] = useState(1);

  const opcion = opcionPorId(opcionId);
  const requiereCapturaManual = !opcion || opcion.precioMensual === null;
  const pendientePricing = !!opcion?.requiereValidacion;

  function resetCaptura() {
    setEspecificacion("");
    setPrecioEstimado(0);
    setCantidad(1);
    setEntregasAnio(1);
  }

  function handleConcepto(next: string) {
    setConcepto(next);
    const first = opcionesPorConcepto(tipo, next)[0];
    setOpcionId(first?.id ?? "");
    resetCaptura();
  }

  function agregar() {
    const selected = opcionPorId(opcionId);
    if (!selected) return;
    const qty=Math.max(1,Math.round(cantidad||1));
    const entregas=tipo==="UNIFORME"?Math.max(1,Math.round(entregasAnio||1)):undefined;

    // Uniformes: el catálogo real trae costo por kit/entrega. Mensualizamos por periodicidad.
    // Equipo/vehículo: el catálogo trae precio mensual unitario.
    let precioUnitario=0;
    let precioMensualTotal=0;
    if(tipo==="UNIFORME"){
      precioUnitario=selected.costoBase ?? precioEstimado;
      if(requiereCapturaManual && (!especificacion.trim() || precioUnitario<=0)) return;
      precioMensualTotal=round2(precioUnitario*qty*(entregas ?? 1)/12);
    }else{
      precioUnitario=selected.precioMensual ?? precioEstimado;
      if(requiereCapturaManual && (!especificacion.trim() || precioUnitario<=0)) return;
      precioMensualTotal=round2(precioUnitario*qty);
    }

    onChange([
      ...selecciones,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tipo,
        concepto,
        opcionId: selected.id,
        nombre: requiereCapturaManual ? especificacion.trim() : selected.nombre,
        precioMensual: precioMensualTotal,
        cantidad:qty,
        precioUnitario,
        entregasAnio:entregas,
        especificacion: requiereCapturaManual ? especificacion.trim() : undefined,
        requiereValidacion: pendientePricing || requiereCapturaManual,
      },
    ]);
    resetCaptura();
  }

  const total = selecciones.reduce((acc, x) => acc + x.precioMensual, 0);

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-900">{titulo}</p>
          <p className="text-xs text-ink-500">Captura el requerimiento total. El importe ya considera cantidad y no vuelve a multiplicarse por HC.</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-ink-400">Total mensual</p>
          <p className="text-sm font-semibold text-ink-900">${total.toLocaleString("es-MX")}</p>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${tipo==="UNIFORME"?"md:grid-cols-4":"md:grid-cols-3"}`}>
        <FieldWrap label="Concepto">
          <SelectInput value={concepto} onChange={(e) => handleConcepto(e.target.value)}>
            {conceptos.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectInput>
        </FieldWrap>
        <FieldWrap label="Opción de catálogo">
          <SelectInput value={opcionId} onChange={(e) => { setOpcionId(e.target.value); resetCaptura(); }}>
            {opcionesPorConcepto(tipo, concepto).map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}{o.costoBase !== undefined ? ` · kit $${o.costoBase.toLocaleString("es-MX",{maximumFractionDigits:2})}` : o.precioMensual !== null ? ` · $${o.precioMensual.toLocaleString("es-MX")}/mes` : ""}
              </option>
            ))}
          </SelectInput>
        </FieldWrap>
        <FieldWrap label="Cantidad requerida">
          <TextInput type="number" min={1} step={1} value={cantidad} onChange={(e)=>setCantidad(Math.max(1,Number(e.target.value)||1))}/>
        </FieldWrap>
        {tipo==="UNIFORME"&&<FieldWrap label="Entregas por año"><SelectInput value={entregasAnio} onChange={(e)=>setEntregasAnio(Number(e.target.value))}><option value={1}>1 · anual</option><option value={2}>2 · cada 6 meses</option><option value={3}>3 · cada 4 meses</option><option value={4}>4 · trimestral</option></SelectInput></FieldWrap>}
      </div>

      <div className="mt-3 flex justify-end"><Button variant="secondary" onClick={agregar}>{labelAgregar(tipo)}</Button></div>

      {opcion?.nota && <div className="mt-3 rounded-lg border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800">{opcion.nota}</div>}

      {requiereCapturaManual && (
        <div className="mt-3 rounded-lg border border-warning-200 bg-warning-50 p-3">
          <p className="text-xs font-semibold text-warning-800">Pendiente de validación por Pricing</p>
          <p className="mt-1 text-[11px] text-warning-700">Especifica el requerimiento y un precio estimado unitario. La cotización puede continuar, pero Pricing deberá aceptar, rechazar o ajustar este concepto.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FieldWrap label="Especifique">
              <TextInput value={especificacion} onChange={(e) => setEspecificacion(e.target.value)} placeholder="Ej. Lámpara táctica recargable 1200 lúmenes" />
            </FieldWrap>
            <FieldWrap label={tipo==="UNIFORME"?"Costo estimado por pieza/kit (MXN)":"Precio estimado unitario mensual (MXN)"}>
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
                <p className="text-xs text-ink-500">
                  {x.cantidad} × ${x.precioUnitario.toLocaleString("es-MX",{maximumFractionDigits:2})}
                  {x.tipo==="UNIFORME"?` × ${x.entregasAnio ?? 1} entrega(s)/año`:"/mes"}
                  {` = $${x.precioMensual.toLocaleString("es-MX",{maximumFractionDigits:2})}/mes`}
                  {x.requiereValidacion ? " · Pendiente de validación" : " · Catálogo autorizado"}
                </p>
              </div>
              <button className="text-xs font-medium text-danger-600 hover:underline" onClick={() => onChange(selecciones.filter((s) => s.id !== x.id))}>Quitar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
