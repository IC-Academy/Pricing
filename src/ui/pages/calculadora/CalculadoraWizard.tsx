import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { createQuotation } from "../../../modules/quotation-service";
import { CIUDADES_DEMO, ESTADO_POR_CIUDAD } from "../../../types";
import type { CiudadDemo, DatosGenerales, ParametrosComerciales, PerfilPuesto, PuestoCotizado } from "../../../types";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { FieldWrap, SelectInput, TextArea, TextInput } from "../../components/Field";
import { newId } from "../../../lib/ids";
import { defaultSalario } from "./defaults";
import { useToast } from "../../../state/ToastContext";
import {
  BENCHMARK_EXTERNO_REFERENCIA,
  CASO_PARIDAD_MACHOTE,
  CLIENTES_ACTUALES_DEMO,
  PARAMETROS_LABORALES_2026,
  benchmarkPara,
  clienteActualPorId,
  type TipoClienteDemo,
} from "../../../data/price-model-real";
import { TIPOS_GUARDIA_DEMO, TURNOS_DEMO } from "../../../data/catalogos-cotizacion";
import { CatalogCostConfigurator, type SeleccionCostoCatalogo } from "./CatalogCostConfigurator";

const PERFILES_COTIZADOR = TIPOS_GUARDIA_DEMO;

function money(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function nuevoPuesto(ciudad: CiudadDemo): PuestoCotizado {
  const tipoPuesto = "Guardia Intramuros" as PerfilPuesto;
  const benchmark = benchmarkPara(ciudad, tipoPuesto);
  return {
    id: newId(),
    tipoPuesto,
    cantidadPosiciones: 1,
    cobertura: "12x7",
    horas: 12,
    dias: 7,
    salarioMensual: benchmark?.recomendado ?? defaultSalario(tipoPuesto, ciudad),
    uniformeCosto: 0,
    equipoCosto: 0,
    vehiculoOpcional: false,
    vehiculoCosto: 0,
  };
}

interface CostosPuesto {
  equipos: SeleccionCostoCatalogo[];
  uniformes: SeleccionCostoCatalogo[];
  vehiculos: SeleccionCostoCatalogo[];
}

const VACIO: CostosPuesto = { equipos: [], uniformes: [], vehiculos: [] };
const STEPS = ["Oportunidad", "Servicio y catálogos", "Parámetros comerciales"];

export function CalculadoraWizard() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? "";
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [tipoCliente, setTipoCliente] = useState<TipoClienteDemo>("NUEVO");
  const [clienteActualId, setClienteActualId] = useState("");
  const [ciudadGeografica, setCiudadGeografica] = useState("Ciudad de México");

  const primerPuesto = useMemo(() => nuevoPuesto("CDMX"), []);
  const [puestos, setPuestos] = useState<PuestoCotizado[]>([primerPuesto]);
  const [costosPorPuesto, setCostosPorPuesto] = useState<Record<string, CostosPuesto>>({ [primerPuesto.id]: { ...VACIO } });

  const [datosGenerales, setDatosGenerales] = useState<DatosGenerales>({
    cliente: "",
    nombreOportunidad: "",
    ciudad: "CDMX",
    estado: ESTADO_POR_CIUDAD.CDMX,
    fecha: new Date().toISOString().slice(0, 10),
    vendedorId: currentUserId,
    vendedorNombre: currentUser?.fullName ?? "",
  });

  const [parametros, setParametros] = useState<ParametrosComerciales>({
    grossMarginObjetivo: PARAMETROS_LABORALES_2026.profitReferenciaPct,
    vigenciaPropuestaDias: 30,
    observaciones: "Demo funcional basada en PM MACHOTE 2026 y auxiliares de Pricing.",
    opcionales: "",
  });

  if (!currentUser) return null;

  function updatePuesto(id: string, patch: Partial<PuestoCotizado>) {
    setPuestos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function syncCostos(id: string, next: CostosPuesto) {
    setCostosPorPuesto((prev) => ({ ...prev, [id]: next }));
    const uniformeCosto = next.uniformes.reduce((a, x) => a + x.precioMensual, 0);
    const equipoCosto = next.equipos.reduce((a, x) => a + x.precioMensual, 0);
    const vehiculoCosto = next.vehiculos.reduce((a, x) => a + x.precioMensual, 0);
    updatePuesto(id, {
      uniformeCosto,
      equipoCosto,
      vehiculoCosto,
      vehiculoOpcional: next.vehiculos.length > 0,
    });
  }

  function changeCiudad(ciudad: CiudadDemo) {
    setDatosGenerales((prev) => ({ ...prev, ciudad, estado: ESTADO_POR_CIUDAD[ciudad] }));
    setPuestos((prev) => prev.map((p) => ({
      ...p,
      salarioMensual: benchmarkPara(ciudad, p.tipoPuesto)?.recomendado ?? defaultSalario(p.tipoPuesto, ciudad),
    })));
  }

  function selectClienteActual(id: string) {
    setClienteActualId(id);
    const cliente = clienteActualPorId(id);
    if (!cliente) return;
    setDatosGenerales((prev) => ({
      ...prev,
      cliente: cliente.cliente,
      nombreOportunidad: `${cliente.site} - Renovación / Nueva propuesta`,
      ciudad: cliente.ciudadOperativa,
      estado: ESTADO_POR_CIUDAD[cliente.ciudadOperativa],
    }));
    setCiudadGeografica(cliente.ciudadGeografica);
    setPuestos((prev) => prev.map((p, index) => index === 0 ? {
      ...p,
      tipoPuesto: cliente.cargo,
      salarioMensual: cliente.salarioActual,
    } : p));
  }

  function addPuesto() {
    const p = nuevoPuesto(datosGenerales.ciudad);
    setPuestos((prev) => [...prev, p]);
    setCostosPorPuesto((prev) => ({ ...prev, [p.id]: { ...VACIO } }));
  }

  function removePuesto(id: string) {
    setPuestos((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
    setCostosPorPuesto((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function canAdvance(): boolean {
    if (step === 0) return datosGenerales.cliente.trim().length > 0 && datosGenerales.nombreOportunidad.trim().length > 0;
    if (step === 1) return puestos.every((p) => p.cantidadPosiciones > 0 && p.salarioMensual > 0);
    return true;
  }

  function resumenCatalogos(): string {
    const lines: string[] = [];
    puestos.forEach((p, idx) => {
      const c = costosPorPuesto[p.id] ?? VACIO;
      [...c.uniformes, ...c.equipos, ...c.vehiculos].forEach((x) => {
        lines.push(`Puesto ${idx + 1}: ${x.concepto} - ${x.nombre} (${money(x.precioMensual)}/mes${x.requiereValidacion ? ", pendiente Pricing" : ""})`);
      });
    });
    return lines.join("\n");
  }

  function validacionesManuales() {
    return puestos.flatMap((p, idx) => {
      const c = costosPorPuesto[p.id] ?? VACIO;
      return [...c.uniformes, ...c.equipos, ...c.vehiculos]
        .filter((x) => x.requiereValidacion)
        .map((x) => ({
          campo: `${x.tipo} especial — Puesto ${idx + 1} — ${x.concepto}: ${x.nombre}`,
          valorCapturado: x.precioMensual,
          comentario: `Concepto fuera de catálogo. Precio estimado por Ventas: ${money(x.precioMensual)}. Requiere validación de Pricing.`,
        }));
    });
  }

  function parametrosConResumen(): ParametrosComerciales {
    const detalle = resumenCatalogos();
    return {
      ...parametros,
      opcionales: [parametros.opcionales, detalle].filter(Boolean).join("\n\n"),
    };
  }

  function handleSaveDraft() {
    createQuotation({ datosGenerales, puestos, parametrosComerciales: parametrosConResumen(), createdBy: currentUserId, asDraft: true });
    showToast("Cotización guardada como borrador.", "info");
    navigate("/mis-cotizaciones");
  }

  function handleCalcular() {
    const quotation = createQuotation({
      datosGenerales,
      puestos,
      parametrosComerciales: parametrosConResumen(),
      createdBy: currentUserId,
      manualValidations: validacionesManuales(),
    });
    if (quotation.status === "PENDIENTE_VALIDACION") {
      showToast("Cotización calculada. Los conceptos fuera de catálogo fueron enviados al Centro de Validaciones.", "warning");
    } else {
      showToast("Cotización calculada con catálogos autorizados.", "success");
    }
    navigate(`/cotizaciones/${quotation.id}`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Nueva Cotización</h2>
          <p className="text-sm text-ink-500">Configuración por catálogos. Los requerimientos especiales continúan el flujo, pero quedan pendientes de validación por Pricing.</p>
        </div>
        <div className="rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-xs text-success-700">
          Control Excel: {CASO_PARIDAD_MACHOTE.cobertura} · {CASO_PARIDAD_MACHOTE.horasPorSemana} HPW · {money(CASO_PARIDAD_MACHOTE.precioPorPuesto)}/puesto
        </div>
      </div>

      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i === step ? "bg-brand-600 text-white" : i < step ? "bg-success-500 text-white" : "bg-ink-200 text-ink-500"}`}>{i < step ? "✓" : i + 1}</div>
            <span className={`hidden text-xs font-medium sm:block ${i === step ? "text-ink-900" : "text-ink-500"}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-ink-200" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => { setTipoCliente("NUEVO"); setClienteActualId(""); setDatosGenerales((d) => ({ ...d, cliente: "", nombreOportunidad: "" })); }} className={`rounded-xl border p-4 text-left ${tipoCliente === "NUEVO" ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-white"}`}>
              <p className="text-sm font-semibold text-ink-900">Cliente nuevo</p><p className="mt-1 text-xs text-ink-500">Captura desde cero y usa benchmark como referencia.</p>
            </button>
            <button onClick={() => setTipoCliente("ACTUAL")} className={`rounded-xl border p-4 text-left ${tipoCliente === "ACTUAL" ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-white"}`}>
              <p className="text-sm font-semibold text-ink-900">Cliente actual</p><p className="mt-1 text-xs text-ink-500">Recupera site, salario y tarifa histórica.</p>
            </button>
          </div>
          <Card className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {tipoCliente === "ACTUAL" ? (
                <FieldWrap label="Cliente / instalación actual"><SelectInput value={clienteActualId} onChange={(e) => selectClienteActual(e.target.value)}><option value="">Selecciona un cliente...</option>{CLIENTES_ACTUALES_DEMO.map((c) => <option key={c.id} value={c.id}>{c.cliente} · {c.site}</option>)}</SelectInput></FieldWrap>
              ) : (
                <FieldWrap label="Cliente"><TextInput value={datosGenerales.cliente} onChange={(e) => setDatosGenerales({ ...datosGenerales, cliente: e.target.value })} placeholder="Razón social del cliente" /></FieldWrap>
              )}
              <FieldWrap label="Nombre de oportunidad / detalle"><TextInput value={datosGenerales.nombreOportunidad} onChange={(e) => setDatosGenerales({ ...datosGenerales, nombreOportunidad: e.target.value })} placeholder="Ej. CEDIS Norte - servicio" /></FieldWrap>
              <FieldWrap label="Ciudad operativa"><SelectInput value={datosGenerales.ciudad} onChange={(e) => changeCiudad(e.target.value as CiudadDemo)}>{CIUDADES_DEMO.map((c) => <option key={c} value={c}>{c}</option>)}</SelectInput></FieldWrap>
              <FieldWrap label="Ciudad geográfica"><TextInput value={ciudadGeografica} onChange={(e) => setCiudadGeografica(e.target.value)} placeholder="Municipio / alcaldía / localidad" /></FieldWrap>
              <FieldWrap label="Estado"><TextInput value={datosGenerales.estado} disabled /></FieldWrap>
              <FieldWrap label="Fecha"><TextInput type="date" value={datosGenerales.fecha} onChange={(e) => setDatosGenerales({ ...datosGenerales, fecha: e.target.value })} /></FieldWrap>
              <FieldWrap label="Vendedor"><TextInput value={datosGenerales.vendedorNombre} disabled /></FieldWrap>
            </div>
          </Card>
          {tipoCliente === "ACTUAL" && clienteActualId && (() => {
            const c = clienteActualPorId(clienteActualId)!;
            return <Card className="border-brand-200 bg-brand-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Referencia cliente actual</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"><div><p className="text-xs text-ink-500">Site</p><p className="text-sm font-semibold">{c.site}</p></div><div><p className="text-xs text-ink-500">Cargo</p><p className="text-sm font-semibold">{c.cargo}</p></div><div><p className="text-xs text-ink-500">Condiciones actuales</p><p className="text-sm font-semibold">{money(c.salarioActual)}</p></div><div><p className="text-xs text-ink-500">Tarifa histórica</p><p className="text-sm font-semibold">{money(c.tarifaActual)}</p></div></div></Card>;
          })()}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          {puestos.map((puesto, idx) => {
            const benchmark = benchmarkPara(datosGenerales.ciudad, puesto.tipoPuesto);
            const horasSemana = puesto.horas * Math.min(puesto.dias, 7);
            const requeridoBase = Math.max(1, horasSemana / 60);
            const costos = costosPorPuesto[puesto.id] ?? VACIO;
            return (
              <Card key={puesto.id} className="p-5">
                <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-ink-900">Puesto {idx + 1}</p><p className="text-xs text-ink-500">Perfil, turno y recursos requeridos.</p></div>{puestos.length > 1 && <button onClick={() => removePuesto(puesto.id)} className="text-xs font-medium text-danger-600 hover:underline">Quitar puesto</button>}</div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FieldWrap label="Clasificación / tipo de guardia"><SelectInput value={puesto.tipoPuesto} onChange={(e) => { const tipoPuesto = e.target.value as PerfilPuesto; updatePuesto(puesto.id, { tipoPuesto, salarioMensual: benchmarkPara(datosGenerales.ciudad, tipoPuesto)?.recomendado ?? defaultSalario(tipoPuesto, datosGenerales.ciudad) }); }}>{PERFILES_COTIZADOR.map((p) => <option key={p} value={p}>{p}</option>)}</SelectInput></FieldWrap>
                  <FieldWrap label="Cantidad de posiciones"><TextInput type="number" min={1} value={puesto.cantidadPosiciones} onChange={(e) => updatePuesto(puesto.id, { cantidadPosiciones: Number(e.target.value) })} /></FieldWrap>
                  <FieldWrap label="Turno / cobertura"><SelectInput value={String(puesto.cobertura)} onChange={(e) => { const t = TURNOS_DEMO.find((x) => x.id === e.target.value); if (!t) return; updatePuesto(puesto.id, { cobertura: t.id as PuestoCotizado["cobertura"], horas: t.horas, dias: t.diasSemana }); }}>{TURNOS_DEMO.map((t) => <option key={t.id} value={t.id}>{t.nombre} · {t.horas}h · {t.diasSemana} días/sem</option>)}</SelectInput></FieldWrap>
                  <FieldWrap label="Salario mensual (MXN)" hint="Fuera de rango genera excepción"><TextInput type="number" value={puesto.salarioMensual} onChange={(e) => updatePuesto(puesto.id, { salarioMensual: Number(e.target.value) })} /></FieldWrap>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-ink-200 bg-ink-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Dimensionamiento operativo</p><div className="mt-3 grid grid-cols-3 gap-2"><div><p className="text-xs text-ink-500">HPW estimadas</p><p className="font-semibold">{horasSemana.toFixed(0)}</p></div><div><p className="text-xs text-ink-500">Requerido base</p><p className="font-semibold">{requeridoBase.toFixed(2)}</p></div><div><p className="text-xs text-ink-500">Control Excel</p><p className="font-semibold">{idx === 0 && datosGenerales.ciudad === "CDMX" ? CASO_PARIDAD_MACHOTE.requeridoTotal.toFixed(2) : "—"}</p></div></div></div>
                  <div className="rounded-xl border border-brand-200 bg-brand-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Benchmark salarial</p>{benchmark ? <div className="mt-3 grid grid-cols-4 gap-2"><div><p className="text-xs text-ink-500">P25</p><p className="font-semibold">{money(benchmark.p25)}</p></div><div><p className="text-xs text-ink-500">P50</p><p className="font-semibold">{money(benchmark.p50)}</p></div><div><p className="text-xs text-ink-500">P75</p><p className="font-semibold">{money(benchmark.p75)}</p></div><div><p className="text-xs text-ink-500">Recomendado</p><p className="font-semibold text-brand-700">{money(benchmark.recomendado)}</p></div><p className="col-span-4 mt-1 text-[11px] text-ink-500">Fuente: {benchmark.fuente} · Rotación ref. {(benchmark.rotacionPct * 100).toFixed(1)}%</p></div> : <p className="mt-2 text-xs text-ink-500">Sin benchmark consolidado; requiere revisión de Pricing.</p>}</div>
                </div>

                <div className="mt-5 space-y-3">
                  <CatalogCostConfigurator tipo="UNIFORME" titulo="Uniformes" selecciones={costos.uniformes} onChange={(items) => syncCostos(puesto.id, { ...costos, uniformes: items })} />
                  <CatalogCostConfigurator tipo="EQUIPO" titulo="Equipamiento" selecciones={costos.equipos} onChange={(items) => syncCostos(puesto.id, { ...costos, equipos: items })} />
                  <CatalogCostConfigurator tipo="VEHICULO" titulo="Vehículos" selecciones={costos.vehiculos} onChange={(items) => syncCostos(puesto.id, { ...costos, vehiculos: items })} />
                </div>
              </Card>
            );
          })}
          <Button variant="secondary" onClick={addPuesto}>+ Agregar puesto</Button>
          <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Referencia externa disponible en archivo 2026</p><div className="mt-2 flex flex-wrap gap-4 text-sm">{BENCHMARK_EXTERNO_REFERENCIA.map((b) => <span key={b.proveedor}><strong>{b.proveedor}</strong> · {b.plaza} · salario {money(b.salario2026)} · tarifa {money(b.tarifa2026)} · factor {b.factor.toFixed(2)}</span>)}</div></Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Card className="p-5"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><FieldWrap label="Gross margin objetivo" hint="Referencia observada en machote: 18%"><TextInput type="number" step="0.1" value={Math.round(parametros.grossMarginObjetivo * 1000) / 10} onChange={(e) => setParametros({ ...parametros, grossMarginObjetivo: Number(e.target.value) / 100 })} /></FieldWrap><FieldWrap label="Vigencia propuesta (días)"><TextInput type="number" value={parametros.vigenciaPropuestaDias} onChange={(e) => setParametros({ ...parametros, vigenciaPropuestaDias: Number(e.target.value) })} /></FieldWrap></div><div className="mt-4"><FieldWrap label="Observaciones"><TextArea rows={3} value={parametros.observaciones} onChange={(e) => setParametros({ ...parametros, observaciones: e.target.value })} /></FieldWrap></div><div className="mt-4"><FieldWrap label="Opcionales / notas comerciales"><TextArea rows={2} value={parametros.opcionales} onChange={(e) => setParametros({ ...parametros, opcionales: e.target.value })} /></FieldWrap></div></Card>
          <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Parámetros laborales 2026 cargados</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><p className="text-xs text-ink-500">UMA diaria</p><p className="font-semibold">{money(PARAMETROS_LABORALES_2026.umaDiaria)}</p></div><div><p className="text-xs text-ink-500">SM diario</p><p className="font-semibold">{money(PARAMETROS_LABORALES_2026.salarioMinimoDiario)}</p></div><div><p className="text-xs text-ink-500">Vacaciones</p><p className="font-semibold">{PARAMETROS_LABORALES_2026.vacacionesDias} días</p></div><div><p className="text-xs text-ink-500">Prima vacacional</p><p className="font-semibold">{PARAMETROS_LABORALES_2026.primaVacacionalPct * 100}%</p></div><div><p className="text-xs text-ink-500">Aguinaldo</p><p className="font-semibold">{PARAMETROS_LABORALES_2026.aguinaldoDias} días</p></div><div><p className="text-xs text-ink-500">Prima dominical</p><p className="font-semibold">{PARAMETROS_LABORALES_2026.primaDominicalPct * 100}%</p></div><div><p className="text-xs text-ink-500">Riesgo B07</p><p className="font-semibold">{PARAMETROS_LABORALES_2026.riesgoTrabajoB07Pct * 100}%</p></div><div><p className="text-xs text-ink-500">Profit referencia</p><p className="font-semibold">{PARAMETROS_LABORALES_2026.profitReferenciaPct * 100}%</p></div></div></Card>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Atrás</Button>
        <div className="flex gap-2"><Button variant="ghost" onClick={handleSaveDraft}>Guardar borrador</Button>{step < STEPS.length - 1 ? <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={!canAdvance()}>Siguiente</Button> : <Button onClick={handleCalcular}>Calcular cotización</Button>}</div>
      </div>
    </div>
  );
}
