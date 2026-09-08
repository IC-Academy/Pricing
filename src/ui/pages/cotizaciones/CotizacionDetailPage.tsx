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

interface PuestoConCosto {
  id:string; tipoPuesto:string; cantidadPosiciones:number; cobertura:string; salarioMensual:number;
  uniformeCosto:number; equipoCosto:number; vehiculoOpcional:boolean; vehiculoCosto:number; costoExamenesMensualizado?:number;
  costoMensualTotal:number; precioRecomendadoUnitario:number; precioTotalPuesto:number;
  desgloseLaboral?:{
    sueldoBaseMensual:number; aguinaldoMensualizado:number; vacacionesMensualizadas:number; primaVacacionalMensualizada:number;
    cargaSocialReferencia:number; isn:number; riesgoTrabajo:number; costoLaboralTotal:number;
  };
}

function buildCostBridge(puestos:PuestoConCosto[], costoMensualTotal:number) {
  const sum=(selector:(p:PuestoConCosto)=>number)=>puestos.reduce((a,p)=>a+selector(p),0);
  const sueldo=sum((p)=>p.salarioMensual*p.cantidadPosiciones);
  const aguinaldo=sum((p)=>(p.desgloseLaboral?.aguinaldoMensualizado??0)*p.cantidadPosiciones);
  const vacaciones=sum((p)=>(p.desgloseLaboral?.vacacionesMensualizadas??0)*p.cantidadPosiciones);
  const primaVacacional=sum((p)=>(p.desgloseLaboral?.primaVacacionalMensualizada??0)*p.cantidadPosiciones);
  const isn=sum((p)=>(p.desgloseLaboral?.isn??0)*p.cantidadPosiciones);
  const riesgo=sum((p)=>(p.desgloseLaboral?.riesgoTrabajo??0)*p.cantidadPosiciones);
  const otrasCargas=sum((p)=>(p.desgloseLaboral?.cargaSocialReferencia??0)*p.cantidadPosiciones);
  const uniformes=sum((p)=>p.uniformeCosto*p.cantidadPosiciones);
  const equipo=sum((p)=>p.equipoCosto*p.cantidadPosiciones);
  const vehiculos=sum((p)=>(p.vehiculoOpcional?p.vehiculoCosto:0)*p.cantidadPosiciones);
  const examenes=sum((p)=>(p.costoExamenesMensualizado??0)*p.cantidadPosiciones);
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

  const allExceptionsResolved = exceptions.length === 0 || exceptions.every((e) => e.status !== "PENDIENTE");
  const canValidate = isAdminLike(currentUser.role) || currentUser.role === "PRICING";
  const canGenerateProposal = (quotation.status === "CALCULADA" || quotation.status === "VALIDADA") && allExceptionsResolved;
  const puestosResultado=(quotation.resultado?.puestos ?? quotation.puestos) as PuestoConCosto[];
  const bridge=quotation.resultado?buildCostBridge(puestosResultado,quotation.resultado.costoMensualTotal):undefined;

  function handleCalcular(){const updated=finalizeDraft(quotation.id);showToast(updated?.status==="PENDIENTE_VALIDACION"?"Se detectaron valores fuera de parámetro. Excepción enviada a Pricing.":"Cotización calculada.",updated?.status==="PENDIENTE_VALIDACION"?"warning":"success");setRefreshKey((k)=>k+1);}
  function handleMarkValidated(){setQuotationStatus(quotation.id,"VALIDADA",currentUser.fullName);showToast("Cotización marcada como validada.","success");setRefreshKey((k)=>k+1);}
  function handleCancelar(){setQuotationStatus(quotation.id,"CANCELADA",currentUser.fullName);showToast("Cotización cancelada.","info");setRefreshKey((k)=>k+1);}

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-3"><h2 className="text-lg font-semibold text-ink-900">{quotation.folio}</h2><QuotationStatusBadge status={quotation.status}/></div><p className="text-sm text-ink-500">{quotation.datosGenerales.cliente} · {quotation.datosGenerales.nombreOportunidad}</p></div><div className="flex flex-wrap gap-2">{quotation.status==="BORRADOR"&&<Button onClick={handleCalcular}>Calcular cotización</Button>}{canValidate&&quotation.status==="CALCULADA"&&<Button variant="secondary" onClick={handleMarkValidated}>Marcar como validada</Button>}{canGenerateProposal&&<Button onClick={()=>{setQuotationStatus(quotation.id,"PROPUESTA_GENERADA",currentUser.fullName);navigate(`/propuesta/${quotation.id}`);}}>Generar propuesta</Button>}{quotation.status==="PROPUESTA_GENERADA"&&<Link to={`/propuesta/${quotation.id}`}><Button variant="secondary">Ver propuesta</Button></Link>}{quotation.status!=="CANCELADA"&&quotation.status!=="PROPUESTA_GENERADA"&&<Button variant="ghost" onClick={handleCancelar}>Cancelar cotización</Button>}</div></div>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader title="Datos generales"/><div className="grid grid-cols-2 gap-4 px-5 py-4 text-sm sm:grid-cols-3"><Info label="Cliente" value={quotation.datosGenerales.cliente}/><Info label="Oportunidad" value={quotation.datosGenerales.nombreOportunidad}/><Info label="Ciudad" value={quotation.datosGenerales.ciudad}/><Info label="Estado" value={quotation.datosGenerales.estado}/><Info label="Fecha" value={formatDateEs(quotation.datosGenerales.fecha)}/><Info label="Vendedor" value={quotation.datosGenerales.vendedorNombre}/></div></Card><Card><CardHeader title="Parámetros comerciales"/><div className="space-y-2 px-5 py-4 text-sm"><Info label="Gross margin objetivo" value={formatPercent(quotation.parametrosComerciales.grossMarginObjetivo)}/><Info label="Vigencia de propuesta" value={`${quotation.parametrosComerciales.vigenciaPropuestaDias} días`}/>{quotation.parametrosComerciales.observaciones&&<Info label="Observaciones" value={quotation.parametrosComerciales.observaciones}/>}</div></Card></div>

    {quotation.resultado&&bridge&&<Card><CardHeader title="Resumen económico del servicio" subtitle="Puente de costo real IC a precio comercial. Montos mensuales y su equivalente anual."/><div className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4"><Kpi label="Costo real IC · mes" value={formatCurrency(quotation.resultado.costoMensualTotal)}/><Kpi label="Costo real IC · año" value={formatCurrency(quotation.resultado.costoAnualTotal??quotation.resultado.costoMensualTotal*12)}/><Kpi label="Precio cliente · mes" value={formatCurrency(quotation.resultado.precioMensualTotal)} accent/><Kpi label="Precio cliente · año" value={formatCurrency(quotation.resultado.precioAnualTotal??quotation.resultado.precioMensualTotal*12)} accent/></div><div className="overflow-x-auto border-t border-ink-100"><table className="w-full min-w-[720px] text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-5 py-2.5 text-left font-medium">Componente de costo</th><th className="px-5 py-2.5 text-right font-medium">Mensual</th><th className="px-5 py-2.5 text-right font-medium">Anual</th></tr></thead><tbody className="divide-y divide-ink-100">{[["Sueldos base",bridge.sueldo],["Aguinaldo · provisión 15 días",bridge.aguinaldo],["Vacaciones · 12 días",bridge.vacaciones],["Prima vacacional · 25%",bridge.primaVacacional],["ISN",bridge.isn],["Riesgo de trabajo",bridge.riesgo],["Otras cargas sociales por desglosar",bridge.otrasCargas],["Uniformes",bridge.uniformes],["Equipamiento",bridge.equipo],["Vehículos",bridge.vehiculos],["Exámenes",bridge.examenes],["Overhead",bridge.overhead],["Indirectos / G&A / financiamiento",bridge.indirectos]].filter(([,v])=>Number(v)>0).map(([label,value])=><tr key={String(label)}><td className="px-5 py-2.5 text-ink-700">{label}</td><td className="px-5 py-2.5 text-right text-ink-700">{formatCurrency(Number(value))}</td><td className="px-5 py-2.5 text-right text-ink-700">{formatCurrency(Number(value)*12)}</td></tr>)}</tbody><tfoot><tr className="border-t border-ink-200 bg-ink-50 font-semibold"><td className="px-5 py-3">Costo real IC</td><td className="px-5 py-3 text-right">{formatCurrency(quotation.resultado.costoMensualTotal)}</td><td className="px-5 py-3 text-right">{formatCurrency(quotation.resultado.costoAnualTotal??quotation.resultado.costoMensualTotal*12)}</td></tr><tr className="bg-brand-50 font-semibold text-brand-800"><td className="px-5 py-3">Precio comercial · GM {formatPercent(quotation.resultado.margenAplicado)}</td><td className="px-5 py-3 text-right">{formatCurrency(quotation.resultado.precioMensualTotal)}</td><td className="px-5 py-3 text-right">{formatCurrency(quotation.resultado.precioAnualTotal??quotation.resultado.precioMensualTotal*12)}</td></tr></tfoot></table></div></Card>}

    <Card><CardHeader title="Puestos cotizados"/><div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm"><thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500"><tr><th className="px-5 py-2.5 font-medium">Puesto / perfil</th><th className="px-5 py-2.5 font-medium">Cant.</th><th className="px-5 py-2.5 font-medium">Cobertura</th><th className="px-5 py-2.5 font-medium">Salario</th><th className="px-5 py-2.5 font-medium">Costo mensual</th><th className="px-5 py-2.5 font-medium">Precio unitario</th><th className="px-5 py-2.5 font-medium">Precio total</th></tr></thead><tbody className="divide-y divide-ink-100">{puestosResultado.map((p)=><tr key={p.id}><td className="px-5 py-2.5 font-medium text-ink-900">{p.tipoPuesto}{"nivelPerfil" in p&&p.nivelPerfil?` · Perfil ${String(p.nivelPerfil)}`:""}</td><td className="px-5 py-2.5 text-ink-600">{p.cantidadPosiciones}</td><td className="px-5 py-2.5 text-ink-600">{p.cobertura}</td><td className="px-5 py-2.5 text-ink-600">{formatCurrency(p.salarioMensual)}</td><td className="px-5 py-2.5 text-ink-600">{Number.isFinite(p.costoMensualTotal)?formatCurrency(p.costoMensualTotal):"—"}</td><td className="px-5 py-2.5 text-ink-600">{Number.isFinite(p.precioRecomendadoUnitario)?formatCurrency(p.precioRecomendadoUnitario):"—"}</td><td className="px-5 py-2.5 font-medium text-ink-900">{Number.isFinite(p.precioTotalPuesto)?formatCurrency(p.precioTotalPuesto):"—"}</td></tr>)}</tbody>{quotation.resultado&&<tfoot><tr className="border-t border-ink-200 bg-ink-50 font-semibold text-ink-900"><td className="px-5 py-3" colSpan={4}>Total</td><td className="px-5 py-3">{formatCurrency(quotation.resultado.costoMensualTotal)}</td><td className="px-5 py-3"/><td className="px-5 py-3">{formatCurrency(quotation.resultado.precioMensualTotal)}</td></tr></tfoot>}</table></div></Card>

    {exceptions.length>0&&<Card><CardHeader title="Excepciones relacionadas" subtitle="Detectadas por el motor de validación al calcular esta cotización."/><div className="divide-y divide-ink-100">{exceptions.map((e)=><div key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"><div><p className="text-sm font-medium text-ink-900">{e.campo}</p><p className="text-xs text-ink-500">Capturado {formatCurrency(e.valorCapturado)} · Rango autorizado {formatCurrency(e.valorEsperadoMin)}–{formatCurrency(e.valorEsperadoMax)}</p></div><ExceptionStatusBadge status={e.status}/></div>)}</div></Card>}

    {quotation.parametrosSnapshot&&<Card className="px-5 py-3"><p className="text-xs text-ink-500">Parámetros congelados el {formatDateTimeEs(quotation.parametrosSnapshot.tomadoEl)}. Esta cotización no cambia aunque los catálogos se actualicen después.</p></Card>}
  </div>;
}

function Info({label,value}:{label:string;value:string}){return <div><p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p><p className="mt-0.5 text-ink-800">{value}</p></div>;}
function Kpi({label,value,accent=false}:{label:string;value:string;accent?:boolean}){return <div className={`rounded-xl border p-4 ${accent?"border-brand-200 bg-brand-50":"border-ink-200 bg-white"}`}><p className="text-xs uppercase tracking-wide text-ink-500">{label}</p><p className={`mt-1 text-xl font-semibold ${accent?"text-brand-700":"text-ink-900"}`}>{value}</p></div>;}
