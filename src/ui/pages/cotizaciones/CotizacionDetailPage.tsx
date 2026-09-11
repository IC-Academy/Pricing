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
import type { PuestoCalculado, PuestoCotizado } from "../../../types";

function buildCostBridge(puestos:PuestoCalculado[], costoMensualTotal:number) {
  const sum=(selector:(p:PuestoCalculado)=>number)=>puestos.reduce((a,p)=>a+selector(p),0);
  const hc=(p:PuestoCalculado)=>p.hcRequerido??p.cantidadPosiciones;
  const sueldo=sum((p)=>p.salarioMensual*hc(p));
  const aguinaldo=sum((p)=>(p.desgloseLaboral?.aguinaldoMensualizado??0)*hc(p));
  const vacaciones=sum((p)=>(p.desgloseLaboral?.vacacionesMensualizadas??0)*hc(p));
  const primaVacacional=sum((p)=>(p.desgloseLaboral?.primaVacacionalMensualizada??0)*hc(p));
  const isn=sum((p)=>(p.desgloseLaboral?.isn??0)*hc(p));
  const riesgo=sum((p)=>(p.desgloseLaboral?.riesgoTrabajo??0)*hc(p));
  const otrasCargas=sum((p)=>(p.desgloseLaboral?.cargaSocialReferencia??0)*hc(p));
  const uniformes=sum((p)=>p.uniformeCosto*p.cantidadPosiciones);
  const equipo=sum((p)=>p.equipoCosto*p.cantidadPosiciones);
  const vehiculos=sum((p)=>(p.vehiculoOpcional?p.vehiculoCosto:0)*p.cantidadPosiciones);
  const examenes=sum((p)=>(p.costoExamenesMensualizado??0)*hc(p));
  const costoPuestos=sum((p)=>p.costoMensualTotal);
  const baseAntesOverhead=sueldo+aguinaldo+vacaciones+primaVacacional+isn+riesgo+otrasCargas+uniformes+equipo+vehiculos+examenes;
  const overhead=Math.max(0,costoPuestos-baseAntesOverhead);
  const indirectos=Math.max(0,costoMensualTotal-costoPuestos);
  return { sueldo,aguinaldo,vacaciones,primaVacacional,isn,riesgo,otrasCargas,uniformes,equipo,vehiculos,examenes,overhead,indirectos };
}

export function CotizacionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const quotation = useMemo(() => (id ? getQuotation(id) : undefined), [id, refreshKey]);
  const exceptions = useMemo(() => (quotation ? exceptionsRepo.getAll().filter((e) => quotation.exceptionIds.includes(e.id)) : []), [quotation, refreshKey]);

  if (!currentUser) return null;
  if (!quotation) return <Card className="mx-auto max-w-lg p-8 text-center"><p className="text-sm text-ink-600">No se encontró la cotización solicitada.</p><Link to="/cotizaciones" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">Volver a Cotizaciones</Link></Card>;

  const q=quotation;
  const actor=currentUser;
  const allExceptionsResolved = exceptions.length === 0 || exceptions.every((e) => e.status !== "PENDIENTE");
  const canValidate = isAdminLike(actor.role) || actor.role === "PRICING";
  const canGenerateProposal = (q.status === "CALCULADA" || q.status === "VALIDADA") && allExceptionsResolved;
  const puestosVista:(PuestoCalculado|PuestoCotizado)[]=q.resultado?.puestos ?? q.puestos;
  const bridge=q.resultado?buildCostBridge(q.resultado.puestos,q.resultado.costoMensualTotal):undefined;

  function handleCalcular(){const updated=finalizeDraft(q.id);showToast(updated?.status==="PENDIENTE_VALIDACION"?"Se detectaron valores fuera de parámetro. Excepción enviada a Pricing.":"Cotización calculada.",updated?.status==="PENDIENTE_VALIDACION"?"warning":"success");setRefreshKey((k)=>k+1);}
  function handleMarkValidated(){setQuotationStatus(q.id,"VALIDADA",actor.fullName);showToast("Cotización marcada como validada.","success");setRefreshKey((k)=>k+1);}
  function handleCancelar(){setQuotationStatus(q.id,"CANCELADA",actor.fullName);showToast("Cotización cancelada.","info");setRefreshKey((k)=>k+1);}

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-3"><h2 className="text-lg font-semibold text-ink-900">{q.folio}</h2><QuotationStatusBadge status={q.status}/></div><p className="text-sm text-ink-500">{q.datosGenerales.cliente} · {q.datosGenerales.nombreOportunidad}</p></div><div className="flex flex-wrap gap-2">{q.status==="BORRADOR"&&<Button onClick={handleCalcular}>Calcular cotización</Button>}{canValidate&&q.status==="CALCULADA"&&<Button variant="secondary" onClick={handleMarkValidated}>Marcar como validada</Button>}{canGenerateProposal&&<Button onClick={()=>{setQuotationStatus(q.id,"PROPUESTA_GENERADA",actor.fullName);navigate(`/propuesta/${q.id}`);}}>Generar propuesta</Button>}{q.status==="PROPUESTA_GENERADA"&&<Link to={`/propuesta/${q.id}`}><Button variant="secondary">Ver propuesta</Button></Link>}{q.status!=="CANCELADA"&&q.status!=="PROPUESTA_GENERADA"&&<Button variant="ghost" onClick={handleCancelar}>Cancelar cotización</Button>}</div></div>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader title="Datos generales"/><div className="grid grid-cols-2 gap-4 px-5 py-4 text-sm sm:grid-cols-3"><Info label="Cliente" value={q.datosGenerales.cliente}/><Info label="Oportunidad" value={q.datosGenerales.nombreOportunidad}/><Info label="Ciudad" value={q.datosGenerales.ciudad}/><Info label="Estado" value={q.datosGenerales.estado}/><Info label="Fecha" value={formatDateEs(q.datosGenerales.fecha)}/><Info label="Vendedor" value={q.datosGenerales.vendedorNombre}/></div></Card><Card><CardHeader title="Parámetros comerciales"/><div className="space-y-2 px-5 py-4 text-sm"><Info label="Gross margin objetivo" value={formatPercent(q.parametrosComerciales.grossMarginObjetivo)}/><Info label="Vigencia de propuesta" value={`${q.parametrosComerciales.vigenciaPropuestaDias} días`}/>{q.parametrosComerciales.observaciones&&<Info label="Observaciones" value={q.parametrosComerciales.observaciones}/>}</div></Card></div>

    {q.resultado&&bridge&&<Card><CardHeader title="Resumen económico del servicio" subtitle="Puente de costo real IC a precio comercial. El HC se dimensiona con esquema base de 72 horas."/><div className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5"><Kpi label="HC requerido" value={String(q.resultado.hcRequeridoTotal??0)}/><Kpi label="Costo real IC · mes" value={formatCurrency(q.resultado.costoMensualTotal)}/><Kpi label="Costo real IC · año" value={formatCurrency(q.resultado.costoAnualTotal??q.resultado.costoMensualTotal*12)}/><Kpi label="Precio cliente · mes" value={formatCurrency(q.resultado.precioMensualTotal)} accent/><Kpi label="Precio cliente · año" value={formatCurrency(q.resultado.precioAnualTotal??q.resultado.precioMensualTotal*12)} accent/></div><div className="overflow-x-auto border-t border-ink-100"><table className="w-full min-w-[720px] text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-5 py-2.5 text-left font-medium">Componente de costo</th><th className="px-5 py-2.5 text-right font-medium">Mensual</th><th className="px-5 py-2.5 text-right font-medium">Anual</th></tr></thead><tbody className="divide-y divide-ink-100">{[["Sueldos base · HC requerido",bridge.sueldo],["Aguinaldo · provisión 15 días",bridge.aguinaldo],["Vacaciones · 12 días",bridge.vacaciones],["Prima vacacional · 25%",bridge.primaVacacional],["ISN",bridge.isn],["Riesgo de trabajo",bridge.riesgo],["Otras cargas sociales por desglosar",bridge.otrasCargas],["Uniformes",bridge.uniformes],["Equipamiento",bridge.equipo],["Vehículos",bridge.vehiculos],["Exámenes",bridge.examenes],["Overhead",bridge.overhead],["Indirectos / G&A / financiamiento",bridge.indirectos]].filter(([,v])=>Number(v)>0).map(([label,value])=><tr key={String(label)}><td className="px-5 py-2.5 text-ink-700">{label}</td><td className="px-5 py-2.5 text-right text-ink-700">{formatCurrency(Number(value))}</td><td className="px-5 py-2.5 text-right text-ink-700">{formatCurrency(Number(value)*12)}</td></tr>)}</tbody><tfoot><tr className="border-t border-ink-200 bg-ink-50 font-semibold"><td className="px-5 py-3">Costo real IC</td><td className="px-5 py-3 text-right">{formatCurrency(q.resultado.costoMensualTotal)}</td><td className="px-5 py-3 text-right">{formatCurrency(q.resultado.costoAnualTotal??q.resultado.costoMensualTotal*12)}</td></tr><tr className="bg-brand-50 font-semibold text-brand-800"><td className="px-5 py-3">Precio comercial · GM {formatPercent(q.resultado.margenAplicado)}</td><td className="px-5 py-3 text-right">{formatCurrency(q.resultado.precioMensualTotal)}</td><td className="px-5 py-3 text-right">{formatCurrency(q.resultado.precioAnualTotal??q.resultado.precioMensualTotal*12)}</td></tr></tfoot></table></div></Card>}

    <Card><CardHeader title="Puestos cotizados"/><div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-5 py-2.5 font-medium">Puesto / perfil</th><th className="px-5 py-2.5 font-medium">Posiciones</th><th className="px-5 py-2.5 font-medium">HPW</th><th className="px-5 py-2.5 font-medium">HC requerido</th><th className="px-5 py-2.5 font-medium">Cobertura</th><th className="px-5 py-2.5 font-medium">Salario</th><th className="px-5 py-2.5 font-medium">Costo mensual</th><th className="px-5 py-2.5 font-medium">Precio unitario</th><th className="px-5 py-2.5 font-medium">Precio total</th></tr></thead><tbody className="divide-y divide-ink-100">{puestosVista.map((p)=>{const calc="costoMensualTotal" in p?p:undefined;return <tr key={p.id}><td className="px-5 py-2.5 font-medium text-ink-900">{p.tipoPuesto}{p.nivelPerfil?` · Perfil ${p.nivelPerfil}`:""}</td><td className="px-5 py-2.5 text-ink-600">{p.cantidadPosiciones}</td><td className="px-5 py-2.5 text-ink-600">{calc?.horasSemana??"—"}</td><td className="px-5 py-2.5 font-medium text-ink-900">{calc?.hcRequerido??"—"}</td><td className="px-5 py-2.5 text-ink-600">{p.cobertura}</td><td className="px-5 py-2.5 text-ink-600">{formatCurrency(p.salarioMensual)}</td><td className="px-5 py-2.5 text-ink-600">{calc?formatCurrency(calc.costoMensualTotal):"—"}</td><td className="px-5 py-2.5 text-ink-600">{calc?formatCurrency(calc.precioRecomendadoUnitario):"—"}</td><td className="px-5 py-2.5 font-medium text-ink-900">{calc?formatCurrency(calc.precioTotalPuesto):"—"}</td></tr>;})}</tbody>{q.resultado&&<tfoot><tr className="border-t border-ink-200 bg-ink-50 font-semibold text-ink-900"><td className="px-5 py-3" colSpan={6}>Total · {q.resultado.hcRequeridoTotal??0} HC requerido</td><td className="px-5 py-3">{formatCurrency(q.resultado.costoMensualTotal)}</td><td className="px-5 py-3"/><td className="px-5 py-3">{formatCurrency(q.resultado.precioMensualTotal)}</td></tr></tfoot>}</table></div></Card>

    {exceptions.length>0&&<Card><CardHeader title="Excepciones relacionadas" subtitle="Detectadas por el motor de validación al calcular esta cotización."/><div className="divide-y divide-ink-100">{exceptions.map((e)=><div key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"><div><p className="text-sm font-medium text-ink-900">{e.campo}</p><p className="text-xs text-ink-500">Capturado {formatCurrency(e.valorCapturado)} · Rango autorizado {formatCurrency(e.valorEsperadoMin)}–{formatCurrency(e.valorEsperadoMax)}</p></div><ExceptionStatusBadge status={e.status}/></div>)}</div></Card>}

    {q.parametrosSnapshot&&<Card className="px-5 py-3"><p className="text-xs text-ink-500">Parámetros congelados el {formatDateTimeEs(q.parametrosSnapshot.tomadoEl)}. Esta cotización no cambia aunque los catálogos se actualicen después.</p></Card>}
  </div>;
}

function Info({label,value}:{label:string;value:string}){return <div><p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p><p className="mt-0.5 whitespace-pre-line text-ink-800">{value}</p></div>;}
function Kpi({label,value,accent=false}:{label:string;value:string;accent?:boolean}){return <div className={`rounded-xl border p-4 ${accent?"border-brand-200 bg-brand-50":"border-ink-200 bg-white"}`}><p className="text-xs uppercase tracking-wide text-ink-500">{label}</p><p className={`mt-1 text-xl font-semibold ${accent?"text-brand-700":"text-ink-900"}`}>{value}</p></div>;}
