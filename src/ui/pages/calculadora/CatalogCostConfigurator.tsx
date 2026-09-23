import { useMemo, useState } from "react";
import { Button } from "../../components/Button";
import { FieldWrap, SelectInput, TextInput } from "../../components/Field";
import {
  conceptosPorTipo,
  opcionPorId,
  opcionesPorConcepto,
  type CatalogoCotizacionTipo,
} from "../../../data/catalogos-cotizacion";

export type AplicacionCosto = "PERSONA"|"PUESTO"|"SITE"|"ADICIONAL";

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
  aplicacion?:AplicacionCosto;
  especificacion?: string;
  requiereValidacion: boolean;
}

interface Props {
  tipo: CatalogoCotizacionTipo;
  titulo: string;
  selecciones: SeleccionCostoCatalogo[];
  onChange: (items: SeleccionCostoCatalogo[]) => void;
  /** Para uniformes: no permite asignar más prendas/kit que el HC total del grupo. */
  maxCantidad?:number;
}

function labelAgregar(tipo: CatalogoCotizacionTipo) {
  if (tipo === "EQUIPO") return "+ Agregar equipo";
  if (tipo === "UNIFORME") return "+ Agregar uniforme";
  return "+ Agregar vehículo";
}

function round2(n:number){ return Math.round(n*100)/100; }
function aplicacionLabel(v:AplicacionCosto){
  return v==="PERSONA"?"Por persona":v==="PUESTO"?"Por puesto":v==="SITE"?"Por site / servicio":"Adicional";
}

export function CatalogCostConfigurator({ tipo, titulo, selecciones, onChange, maxCantidad }: Props) {
  const conceptos = useMemo(() => conceptosPorTipo(tipo), [tipo]);
  const [concepto, setConcepto] = useState(conceptos[0] ?? "");
  const opciones = useMemo(() => opcionesPorConcepto(tipo, concepto), [tipo, concepto]);
  const [opcionId, setOpcionId] = useState(opciones[0]?.id ?? "");
  const [especificacion, setEspecificacion] = useState("");
  const [precioEstimado, setPrecioEstimado] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [entregasAnio, setEntregasAnio] = useState(1);
  const [aplicacion,setAplicacion]=useState<AplicacionCosto>("PERSONA");

  const opcion = opcionPorId(opcionId);
  const requiereCapturaManual = !opcion || opcion.precioMensual === null;
  const pendientePricing = !!opcion?.requiereValidacion;
  const cantidadAsignada=selecciones.reduce((a,x)=>a+x.cantidad,0);
  const disponibleUniforme=tipo==="UNIFORME"&&maxCantidad!==undefined?Math.max(0,maxCantidad-cantidadAsignada):undefined;

  function resetCaptura() {
    setEspecificacion("");
    setPrecioEstimado(0);
    setCantidad(1);
    setEntregasAnio(1);
    setAplicacion("PERSONA");
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
    if(tipo==="UNIFORME"&&maxCantidad!==undefined&&cantidadAsignada+qty>maxCantidad) return;
    const entregas=tipo==="UNIFORME"?Math.max(1,Math.round(entregasAnio||1)):undefined;

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
        aplicacion:tipo==="EQUIPO"?aplicacion:tipo==="VEHICULO"?"SITE":undefined,
        especificacion: requiereCapturaManual ? especificacion.trim() : undefined,
        requiereValidacion: pendientePricing || requiereCapturaManual,
      },
    ]);
    resetCaptura();
  }

  const total = selecciones.reduce((acc, x) => acc + x.precioMensual, 0);
  const grid=tipo==="UNIFORME"?"md:grid-cols-4":tipo==="EQUIPO"?"md:grid-cols-4":"md:grid-cols-3";

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-[0_8px_24px_rgba(13,31,55,.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-800">{titulo}</p>
          <p className="mt-1 text-xs text-ink-500">
            {tipo==="UNIFORME"?"Asigna kits sobre el total de guardias. No se permite exceder el HC total.":"Captura la cantidad real requerida; el importe no vuelve a multiplicarse por HC."}
          </p>
        </div>
        <div className="flex gap-2">
          {tipo==="UNIFORME"&&maxCantidad!==undefined&&<div className="rounded-xl bg-brand-50 px-3 py-2 text-right"><p className="text-[10px] uppercase tracking-wide text-ink-400">Asignados</p><p className="text-sm font-semibold text-brand-700">{cantidadAsignada} / {maxCantidad}</p></div>}
          <div className="rounded-xl bg-ink-50 px-3 py-2 text-right"><p className="text-[10px] uppercase tracking-wide text-ink-400">Total mensual</p><p className="text-sm font-semibold text-ink-900">${total.toLocaleString("es-MX")}</p></div>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${grid}`}>
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
        <FieldWrap label={tipo==="UNIFORME"?"Guardias / kits":"Cantidad requerida"} hint={disponibleUniforme!==undefined?`Disponibles: ${disponibleUniforme}`:undefined}>
          <TextInput type="number" min={1} max={disponibleUniforme} step={1} value={cantidad} onChange={(e)=>setCantidad(Math.max(1,Number(e.target.value)||1))}/>
        </FieldWrap>
        {tipo==="UNIFORME"&&<FieldWrap label="Entregas por año"><SelectInput value={entregasAnio} onChange={(e)=>setEntregasAnio(Number(e.target.value))}><option value={1}>1 · anual</option><option value={2}>2 · cada 6 meses</option><option value={3}>3 · cada 4 meses</option><option value={4}>4 · trimestral</option></SelectInput></FieldWrap>}
        {tipo==="EQUIPO"&&<FieldWrap label="Aplicación"><SelectInput value={aplicacion} onChange={(e)=>setAplicacion(e.target.value as AplicacionCosto)}><option value="PERSONA">Por persona</option><option value="PUESTO">Por puesto</option><option value="SITE">Por site / servicio</option><option value="ADICIONAL">Adicional</option></SelectInput></FieldWrap>}
      </div>

      {tipo==="UNIFORME"&&disponibleUniforme===0&&<div className="mt-3 rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-xs text-success-700"><b>Asignación completa.</b> Ya se distribuyó uniforme para todo el HC del grupo.</div>}
      {tipo==="UNIFORME"&&maxCantidad!==undefined&&cantidadAsignada+Math.max(1,cantidad)>maxCantidad&&<div className="mt-3 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-xs text-danger-700">La cantidad seleccionada excede el total de guardias disponibles ({maxCantidad}).</div>}

      <div className="mt-3 flex justify-end"><Button variant="secondary" onClick={agregar} disabled={tipo==="UNIFORME"&&maxCantidad!==undefined&&(disponibleUniforme===0||cantidadAsignada+Math.max(1,cantidad)>maxCantidad)}>{labelAgregar(tipo)}</Button></div>

      {opcion?.nota && <div className="mt-3 rounded-lg border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800">{opcion.nota}</div>}

      {requiereCapturaManual && (
        <div className="mt-3 rounded-xl border border-warning-200 bg-warning-50 p-3">
          <p className="text-xs font-semibold text-warning-800">Pendiente de validación por Pricing</p>
          <p className="mt-1 text-[11px] text-warning-700">Especifica el requerimiento y un precio estimado unitario. Pricing podrá aceptar, rechazar o ajustar el concepto.</p>
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
        <div className="mt-4 divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-100">
          {selecciones.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <div>
                <p className="font-medium text-ink-900">{x.concepto} · {x.nombre}</p>
                <p className="text-xs text-ink-500">
                  {x.cantidad} × ${x.precioUnitario.toLocaleString("es-MX",{maximumFractionDigits:2})}
                  {x.tipo==="UNIFORME"?` × ${x.entregasAnio ?? 1} entrega(s)/año`:"/mes"}
                  {x.aplicacion?` · ${aplicacionLabel(x.aplicacion)}`:""}
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
