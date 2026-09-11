import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { catalogItemsRepo, exceptionsRepo, quotationsRepo, benchmarkRepo, globalConfigStore } from "../../../data/db";
import { countByVigencia, getVigenciaEstado } from "../../../modules/catalog-service";
import { computeVigenciaEstado } from "../../../lib/vigencia";
import { Card, CardHeader } from "../../components/Card";
import { VigenciaBadge } from "../../components/VigenciaBadge";
import { QuotationStatusBadge } from "../../components/StatusBadge";
import { formatDateEs, formatDateTimeEs, formatCurrency } from "../../../lib/ids";
import type { CatalogType } from "../../../types";

const CATALOG_LABELS: Record<CatalogType,string>={SALARIOS:"Salarios",IMPUESTOS:"Impuestos",UNIFORMES:"Uniformes",VEHICULOS:"Vehículos",EQUIPAMIENTO:"Equipamiento"};

export function DashboardPage(){
  const {currentUser}=useAuth();
  const today=new Date();
  const catalogItems=catalogItemsRepo.getAll();
  const quotations=quotationsRepo.getAll();
  const exceptions=exceptionsRepo.getAll();
  const benchmark=benchmarkRepo.getAll();
  const globalConfig=globalConfigStore.get();

  const counts=useMemo(()=>countByVigencia(catalogItems,today),[catalogItems]);
  const pendingExceptions=exceptions.filter(e=>e.status==="PENDIENTE").length;
  const startOfMonth=new Date(today.getFullYear(),today.getMonth(),1);
  const quotationsThisMonth=quotations.filter(q=>new Date(q.createdAt)>=startOfMonth);
  const approvedThisMonth=quotationsThisMonth.filter(q=>["VALIDADA","PROPUESTA_GENERADA"].includes(q.status)).length;
  const valueThisMonth=quotationsThisMonth.reduce((acc,q)=>acc+(q.resultado?.precioMensualTotal??0),0);

  const healthRows=(Object.keys(CATALOG_LABELS) as CatalogType[]).map(type=>{
    const items=catalogItems.filter(i=>i.catalogType===type&&i.activo);
    return {label:CATALOG_LABELS[type],estado:worstEstado(items.map(i=>getVigenciaEstado(i,today)))};
  });
  healthRows.push({label:"Benchmark",estado:worstEstado(benchmark.filter(b=>b.activo).map(b=>computeVigenciaEstado(b,today)))});

  const recent=[...quotations].sort((a,b)=>(a.createdAt<b.createdAt?1:-1)).slice(0,6);
  const attention=catalogItems.filter(i=>{const e=getVigenciaEstado(i,today);return e==="PROXIMO_A_VENCER"||e==="VENCIDO";}).slice(0,5);
  const firstName=currentUser?.fullName.split(" ")[0]??"Equipo";

  return <div className="space-y-6 pb-8">
    <section className="relative overflow-hidden rounded-[28px] bg-brand-800 px-6 py-7 text-white shadow-[0_24px_70px_rgba(13,31,55,.20)] md:px-8 md:py-9">
      <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-accent-500/18 blur-3xl"/>
      <div className="pointer-events-none absolute bottom-[-80px] left-[38%] h-56 w-56 rounded-full bg-brand-400/18 blur-3xl"/>
      <div className="relative grid gap-7 lg:grid-cols-[1.4fr_.9fr] lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-white/70"><span className="h-1.5 w-1.5 rounded-full bg-accent-500"/> Pricing Intelligence</div>
          <h2 className="max-w-2xl text-2xl font-semibold tracking-[-.04em] md:text-[32px]">Bienvenido, {firstName}.<br/><span className="text-white/68">Cotiza con datos, precisión y contexto operativo.</span></h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/55">Price Model convierte benchmark, estructura operativa, Gross Comp y catálogos vigentes en decisiones comerciales más rápidas y trazables.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/calculadora" className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-brand-800 shadow-[0_10px_26px_rgba(254,197,42,.22)] transition hover:-translate-y-0.5 hover:bg-accent-400"><span className="text-lg leading-none">＋</span>Nueva cotización</Link>
            <Link to="/cotizaciones" className="inline-flex items-center rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white/85 backdrop-blur-sm transition hover:bg-white/13">Ver cotizaciones</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <HeroMetric label="Cotizaciones" value={quotationsThisMonth.length} hint="este mes"/>
          <HeroMetric label="En validación" value={pendingExceptions} hint="pendientes" tone="accent"/>
          <HeroMetric label="Aprobadas" value={approvedThisMonth} hint="este mes"/>
          <HeroMetric label="Valor mensual" value={formatCurrency(valueThisMonth)} hint="pipeline cotizado" compact/>
        </div>
      </div>
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
      <Card className="overflow-hidden">
        <CardHeader title="Cotizaciones recientes" subtitle="Seguimiento rápido de las oportunidades más recientes." action={<Link to="/cotizaciones" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50">Ver todas →</Link>}/>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ink-50/80 text-[10px] font-semibold uppercase tracking-[.12em] text-ink-400"><tr><th className="px-6 py-3">Folio</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Oportunidad</th><th className="px-4 py-3">Estado</th><th className="px-6 py-3 text-right">Precio mes</th></tr></thead>
            <tbody className="divide-y divide-ink-100">{recent.map(q=><tr key={q.id} className="group transition hover:bg-brand-50/45"><td className="px-6 py-3.5"><Link to={`/cotizaciones/${q.id}`} className="font-semibold text-brand-700 group-hover:text-brand-600">{q.folio}</Link></td><td className="px-4 py-3.5 font-medium text-ink-800">{q.datosGenerales.cliente}</td><td className="max-w-[260px] truncate px-4 py-3.5 text-ink-500">{q.datosGenerales.nombreOportunidad}</td><td className="px-4 py-3.5"><QuotationStatusBadge status={q.status}/></td><td className="px-6 py-3.5 text-right font-semibold text-ink-800">{q.resultado?formatCurrency(q.resultado.precioMensualTotal):"—"}</td></tr>)}{recent.length===0&&<tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-ink-400">Todavía no hay cotizaciones.</td></tr>}</tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Acciones rápidas" subtitle="Atajos para la operación diaria."/>
          <div className="grid gap-2.5 p-4">
            <QuickAction to="/calculadora" icon="＋" title="Nueva cotización" text="Crea una propuesta desde cero" primary/>
            <QuickAction to="/validaciones" icon="✓" title="Centro de validaciones" text={`${pendingExceptions} pendiente${pendingExceptions===1?"":"s"}`}/>
            <QuickAction to="/benchmark" icon="↗" title="Benchmark salarial" text="Compara mercado y rotación"/>
            <QuickAction to="/catalogos" icon="▦" title="Catálogos" text="Precios, vigencias y parámetros"/>
          </div>
        </Card>

        <Card>
          <CardHeader title="Salud del modelo" subtitle={`Actualizado ${formatDateTimeEs(globalConfig.ultimaActualizacionModelo)}`}/>
          <div className="divide-y divide-ink-100 px-2">{healthRows.map(row=><div key={row.label} className="flex items-center justify-between px-3 py-2.5"><span className="text-xs font-medium text-ink-700">{row.label}</span><VigenciaBadge estado={row.estado}/></div>)}</div>
        </Card>
      </div>
    </div>

    <Card className="overflow-hidden">
      <CardHeader title="Catálogos que requieren atención" subtitle="Vigencias próximas a vencer o vencidas que pueden afectar una nueva cotización."/>
      {attention.length>0?<div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-ink-50/80 text-[10px] font-semibold uppercase tracking-[.12em] text-ink-400"><tr><th className="px-6 py-3">Catálogo</th><th className="px-4 py-3">Ubicación</th><th className="px-4 py-3">Vencimiento</th><th className="px-4 py-3">Responsable</th><th className="px-6 py-3">Estado</th></tr></thead><tbody className="divide-y divide-ink-100">{attention.map(i=><tr key={i.id} className="hover:bg-ink-50/60"><td className="px-6 py-3.5 font-semibold text-ink-800">{i.nombre}</td><td className="px-4 py-3.5 text-ink-500">{i.ubicacion}</td><td className="px-4 py-3.5 text-ink-500">{formatDateEs(i.fechaVencimiento)}</td><td className="px-4 py-3.5 text-ink-500">{i.responsable}</td><td className="px-6 py-3.5"><VigenciaBadge estado={getVigenciaEstado(i,today)}/></td></tr>)}</tbody></table></div>:<div className="px-6 py-10 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-success-50 text-success-600">✓</div><p className="mt-3 text-sm font-semibold text-ink-800">Catálogos al día</p><p className="mt-1 text-xs text-ink-500">No hay vigencias críticas en este momento.</p></div>}
    </Card>
  </div>;
}

function HeroMetric({label,value,hint,tone="normal",compact=false}:{label:string;value:string|number;hint:string;tone?:"normal"|"accent";compact?:boolean}){return <div className={`rounded-2xl border p-4 backdrop-blur-sm ${tone==="accent"?"border-accent-500/20 bg-accent-500/12":"border-white/10 bg-white/7"}`}><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/45">{label}</p><p className={`mt-1.5 font-semibold tracking-[-.03em] ${compact?"text-lg":"text-2xl"} ${tone==="accent"?"text-accent-500":"text-white"}`}>{value}</p><p className="mt-0.5 text-[10px] text-white/38">{hint}</p></div>}
function QuickAction({to,icon,title,text,primary=false}:{to:string;icon:string;title:string;text:string;primary?:boolean}){return <Link to={to} className={`group flex items-center gap-3 rounded-xl border p-3 transition ${primary?"border-brand-700 bg-brand-700 text-white shadow-[0_10px_24px_rgba(0,42,92,.14)] hover:bg-brand-600":"border-ink-100 bg-ink-50/60 hover:border-brand-200 hover:bg-brand-50"}`}><span className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-semibold ${primary?"bg-white/10 text-accent-500":"bg-white text-brand-700 shadow-sm ring-1 ring-ink-100"}`}>{icon}</span><span><span className={`block text-xs font-semibold ${primary?"text-white":"text-ink-800"}`}>{title}</span><span className={`mt-0.5 block text-[10px] ${primary?"text-white/55":"text-ink-400"}`}>{text}</span></span><span className={`ml-auto transition group-hover:translate-x-0.5 ${primary?"text-white/55":"text-ink-300"}`}>→</span></Link>}

function worstEstado(estados:ReturnType<typeof getVigenciaEstado>[]):ReturnType<typeof getVigenciaEstado>{if(estados.some(e=>e==="VENCIDO"))return"VENCIDO";if(estados.some(e=>e==="PROXIMO_A_VENCER"))return"PROXIMO_A_VENCER";if(estados.some(e=>e==="VIGENTE"))return"VIGENTE";return"SIN_VIGENCIA";}
export {CATALOG_LABELS};
