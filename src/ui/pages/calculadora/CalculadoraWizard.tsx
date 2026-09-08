import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { createQuotation } from "../../../modules/quotation-service";
import { calcularCotizacion } from "../../../modules/pricing-engine";
import { CIUDADES_DEMO, ESTADO_POR_CIUDAD } from "../../../types";
import type { CiudadDemo, DatosGenerales, NivelPerfil, ParametrosComerciales, PerfilPuesto, PuestoCotizado, TipoExamen } from "../../../types";
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
  EXAMENES_DEMO,
  PARAMETROS_LABORALES_2026,
  PERFIL_REQUISITOS,
  benchmarkPara,
  clienteActualPorId,
  estructuraPara,
  salarioPorNivel,
  type TipoClienteDemo,
} from "../../../data/price-model-real";
import { TIPOS_GUARDIA_DEMO, TURNOS_DEMO } from "../../../data/catalogos-cotizacion";
import { CatalogCostConfigurator, type SeleccionCostoCatalogo } from "./CatalogCostConfigurator";

const PERFILES_COTIZADOR = TIPOS_GUARDIA_DEMO;
const NIVELES: NivelPerfil[] = ["A", "AA", "ELITE"];

function money(n:number, currency:"MXN"|"USD"="MXN") {
  return new Intl.NumberFormat("es-MX", { style:"currency", currency, maximumFractionDigits:2 }).format(n);
}

function nuevoPuesto(ciudad:CiudadDemo):PuestoCotizado {
  const tipoPuesto="Guardia Intramuros" as PerfilPuesto;
  const base=benchmarkPara(ciudad,tipoPuesto)?.recomendado ?? defaultSalario(tipoPuesto,ciudad);
  return {
    id:newId(), tipoPuesto, nivelPerfil:"A", cantidadPosiciones:1, cobertura:"12x7", horas:12, dias:7,
    salarioMensual:base, uniformeCosto:0, equipoCosto:0, vehiculoOpcional:false, vehiculoCosto:0,
    examenes:["MEDICO"], costoExamenesMensualizado:0,
  };
}

interface CostosPuesto { equipos:SeleccionCostoCatalogo[]; uniformes:SeleccionCostoCatalogo[]; vehiculos:SeleccionCostoCatalogo[]; }
const VACIO:CostosPuesto={equipos:[],uniformes:[],vehiculos:[]};
const STEPS=["Oportunidad","Servicio y catálogos","Parámetros y costos"];

export function CalculadoraWizard() {
  const { currentUser }=useAuth();
  const currentUserId=currentUser?.id ?? "";
  const { showToast }=useToast();
  const navigate=useNavigate();
  const [step,setStep]=useState(0);
  const [tipoCliente,setTipoCliente]=useState<TipoClienteDemo>("NUEVO");
  const [clienteActualId,setClienteActualId]=useState("");
  const [ciudadGeografica,setCiudadGeografica]=useState("Ciudad de México");

  const primerPuesto=useMemo(()=>nuevoPuesto("CDMX"),[]);
  const [puestos,setPuestos]=useState<PuestoCotizado[]>([primerPuesto]);
  const [costosPorPuesto,setCostosPorPuesto]=useState<Record<string,CostosPuesto>>({[primerPuesto.id]:{...VACIO}});

  const [datosGenerales,setDatosGenerales]=useState<DatosGenerales>({
    cliente:"", nombreOportunidad:"", ciudad:"CDMX", estado:ESTADO_POR_CIUDAD.CDMX,
    fecha:new Date().toISOString().slice(0,10), vendedorId:currentUserId, vendedorNombre:currentUser?.fullName ?? "",
  });
  const [parametros,setParametros]=useState<ParametrosComerciales>({
    grossMarginObjetivo:PARAMETROS_LABORALES_2026.profitReferenciaPct,
    vigenciaPropuestaDias:30, moneda:"MXN", tipoCambioUsdMxn:18,
    observaciones:"Demo funcional basada en PM MACHOTE 2026 y auxiliares de Pricing.", opcionales:"",
  });

  const estructura=estructuraPara(datosGenerales.ciudad);
  const totalPosiciones=puestos.reduce((a,p)=>a+p.cantidadPosiciones,0);
  const simulacionEstructura=useMemo(()=>{
    if(!estructura) return null;
    const hcProyectado=estructura.hc+totalPosiciones;
    const ratioSupActual=estructura.hcPorSupervisor || (estructura.supervisores?estructura.hc/estructura.supervisores:0);
    const ratioRecActual=estructura.personasPorReclutador || (estructura.reclutadores?estructura.hc/estructura.reclutadores:0);
    const supNecesarios=estructura.supervisores>0 && ratioSupActual>0 ? Math.max(0,Math.ceil(hcProyectado/(ratioSupActual*1.1))-estructura.supervisores) : 0;
    const recNecesarios=estructura.reclutadores>0 && ratioRecActual>0 ? Math.max(0,Math.ceil(hcProyectado/(ratioRecActual*1.1))-estructura.reclutadores) : 0;
    return {hcProyectado,supNecesarios,recNecesarios};
  },[estructura,totalPosiciones]);

  const preview=useMemo(()=>calcularCotizacion(puestos,parametros,datosGenerales),[puestos,parametros,datosGenerales]);

  if(!currentUser) return null;

  function updatePuesto(id:string,patch:Partial<PuestoCotizado>){setPuestos((prev)=>prev.map((p)=>p.id===id?{...p,...patch}:p));}
  function syncCostos(id:string,next:CostosPuesto){
    setCostosPorPuesto((prev)=>({...prev,[id]:next}));
    updatePuesto(id,{
      uniformeCosto:next.uniformes.reduce((a,x)=>a+x.precioMensual,0),
      equipoCosto:next.equipos.reduce((a,x)=>a+x.precioMensual,0),
      vehiculoCosto:next.vehiculos.reduce((a,x)=>a+x.precioMensual,0),
      vehiculoOpcional:next.vehiculos.length>0,
    });
  }
  function changeCiudad(ciudad:CiudadDemo){
    setDatosGenerales((prev)=>({...prev,ciudad,estado:ESTADO_POR_CIUDAD[ciudad]}));
    setPuestos((prev)=>prev.map((p)=>{
      const base=benchmarkPara(ciudad,p.tipoPuesto)?.recomendado ?? defaultSalario(p.tipoPuesto,ciudad);
      return {...p,salarioMensual:salarioPorNivel(base,p.nivelPerfil ?? "A")};
    }));
  }
  function changeNivel(id:string,nivel:NivelPerfil){
    const p=puestos.find((x)=>x.id===id); if(!p) return;
    const base=benchmarkPara(datosGenerales.ciudad,p.tipoPuesto)?.recomendado ?? defaultSalario(p.tipoPuesto,datosGenerales.ciudad);
    updatePuesto(id,{nivelPerfil:nivel,salarioMensual:salarioPorNivel(base,nivel)});
  }
  function selectClienteActual(id:string){
    setClienteActualId(id); const c=clienteActualPorId(id); if(!c) return;
    setDatosGenerales((prev)=>({...prev,cliente:c.cliente,nombreOportunidad:`${c.site} - Renovación / Nueva propuesta`,ciudad:c.ciudadOperativa,estado:ESTADO_POR_CIUDAD[c.ciudadOperativa]}));
    setCiudadGeografica(c.ciudadGeografica);
    setPuestos((prev)=>prev.map((p,i)=>i===0?{...p,tipoPuesto:c.cargo,nivelPerfil:"A",salarioMensual:c.salarioActual}:p));
  }
  function addPuesto(){const p=nuevoPuesto(datosGenerales.ciudad);setPuestos((prev)=>[...prev,p]);setCostosPorPuesto((prev)=>({...prev,[p.id]:{...VACIO}}));}
  function removePuesto(id:string){setPuestos((prev)=>prev.length>1?prev.filter((p)=>p.id!==id):prev);setCostosPorPuesto((prev)=>{const next={...prev};delete next[id];return next;});}
  function toggleExamen(id:string, examen:TipoExamen){
    const p=puestos.find((x)=>x.id===id); if(!p) return;
    const current=p.examenes ?? [];
    updatePuesto(id,{examenes:current.includes(examen)?current.filter((x)=>x!==examen):[...current,examen]});
  }
  function canAdvance(){if(step===0)return !!datosGenerales.cliente.trim()&&!!datosGenerales.nombreOportunidad.trim();if(step===1)return puestos.every((p)=>p.cantidadPosiciones>0&&p.salarioMensual>0);return true;}

  function resumenCatalogos(){
    const lines:string[]=[];
    puestos.forEach((p,idx)=>{
      const c=costosPorPuesto[p.id]??VACIO;
      lines.push(`Puesto ${idx+1}: ${p.tipoPuesto} Perfil ${p.nivelPerfil ?? "A"} · Exámenes ${(p.examenes??[]).join(", ")||"sin selección"}`);
      [...c.uniformes,...c.equipos,...c.vehiculos].forEach((x)=>lines.push(`  ${x.concepto} - ${x.nombre} (${money(x.precioMensual)}/mes${x.requiereValidacion?", pendiente Pricing":""})`));
    });
    return lines.join("\n");
  }
  function validacionesManuales(){
    const catalogos=puestos.flatMap((p,idx)=>{
      const c=costosPorPuesto[p.id]??VACIO;
      return [...c.uniformes,...c.equipos,...c.vehiculos].filter((x)=>x.requiereValidacion).map((x)=>({campo:`${x.tipo} especial — Puesto ${idx+1} — ${x.concepto}: ${x.nombre}`,valorCapturado:x.precioMensual,comentario:`Concepto fuera de catálogo. Precio estimado ${money(x.precioMensual)}. Requiere validación de Pricing.`}));
    });
    const examenes=puestos.flatMap((p,idx)=>(p.examenes??[]).filter((e)=>EXAMENES_DEMO.find((x)=>x.id===e)?.requiereValidacion).map((e)=>({campo:`Examen especializado — Puesto ${idx+1} — ${EXAMENES_DEMO.find((x)=>x.id===e)?.nombre ?? e}`,valorCapturado:p.costoExamenesMensualizado ?? 0,comentario:"Examen especializado: validar costo unitario, periodicidad y mensualización con Pricing."})));
    return [...catalogos,...examenes];
  }
  function parametrosConResumen():ParametrosComerciales{return {...parametros,opcionales:[parametros.opcionales,resumenCatalogos()].filter(Boolean).join("\n\n")};}
  function handleSaveDraft(){createQuotation({datosGenerales,puestos,parametrosComerciales:parametrosConResumen(),createdBy:currentUserId,asDraft:true});showToast("Cotización guardada como borrador.","info");navigate("/mis-cotizaciones");}
  function handleCalcular(){const q=createQuotation({datosGenerales,puestos,parametrosComerciales:parametrosConResumen(),createdBy:currentUserId,manualValidations:validacionesManuales()});showToast(q.status==="PENDIENTE_VALIDACION"?"Cotización calculada con conceptos pendientes de validación.":"Cotización calculada con parámetros autorizados.",q.status==="PENDIENTE_VALIDACION"?"warning":"success");navigate(`/cotizaciones/${q.id}`);}

  return <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><h2 className="text-lg font-semibold text-ink-900">Nueva Cotización</h2><p className="text-sm text-ink-500">Puesto + Perfil A/AA/Elite + cobertura + exámenes + equipos + Gross Comp.</p></div><div className="rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-xs text-success-700">Control Excel: {CASO_PARIDAD_MACHOTE.cobertura} · {CASO_PARIDAD_MACHOTE.horasPorSemana} HPW · {money(CASO_PARIDAD_MACHOTE.precioPorPuesto)}/puesto</div></div>
    <ol className="flex items-center gap-2">{STEPS.map((label,i)=><li key={label} className="flex flex-1 items-center gap-2"><div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i===step?"bg-brand-600 text-white":i<step?"bg-success-500 text-white":"bg-ink-200 text-ink-500"}`}>{i<step?"✓":i+1}</div><span className={`hidden text-xs font-medium sm:block ${i===step?"text-ink-900":"text-ink-500"}`}>{label}</span>{i<STEPS.length-1&&<div className="h-px flex-1 bg-ink-200"/>}</li>)}</ol>

    {step===0&&<div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2"><button onClick={()=>{setTipoCliente("NUEVO");setClienteActualId("");setDatosGenerales((d)=>({...d,cliente:"",nombreOportunidad:""}));}} className={`rounded-xl border p-4 text-left ${tipoCliente==="NUEVO"?"border-brand-500 bg-brand-50":"border-ink-200 bg-white"}`}><p className="text-sm font-semibold">Cliente nuevo</p><p className="text-xs text-ink-500">Captura desde cero y usa benchmark.</p></button><button onClick={()=>setTipoCliente("ACTUAL")} className={`rounded-xl border p-4 text-left ${tipoCliente==="ACTUAL"?"border-brand-500 bg-brand-50":"border-ink-200 bg-white"}`}><p className="text-sm font-semibold">Cliente actual</p><p className="text-xs text-ink-500">Recupera site, salario y tarifa histórica.</p></button></div>
      <Card className="p-5"><div className="grid gap-4 sm:grid-cols-2">{tipoCliente==="ACTUAL"?<FieldWrap label="Cliente / instalación actual"><SelectInput value={clienteActualId} onChange={(e)=>selectClienteActual(e.target.value)}><option value="">Selecciona...</option>{CLIENTES_ACTUALES_DEMO.map((c)=><option key={c.id} value={c.id}>{c.cliente} · {c.site}</option>)}</SelectInput></FieldWrap>:<FieldWrap label="Cliente"><TextInput value={datosGenerales.cliente} onChange={(e)=>setDatosGenerales({...datosGenerales,cliente:e.target.value})}/></FieldWrap>}<FieldWrap label="Oportunidad / detalle"><TextInput value={datosGenerales.nombreOportunidad} onChange={(e)=>setDatosGenerales({...datosGenerales,nombreOportunidad:e.target.value})}/></FieldWrap><FieldWrap label="Ciudad operativa"><SelectInput value={datosGenerales.ciudad} onChange={(e)=>changeCiudad(e.target.value as CiudadDemo)}>{CIUDADES_DEMO.map((c)=><option key={c}>{c}</option>)}</SelectInput></FieldWrap><FieldWrap label="Ciudad geográfica"><TextInput value={ciudadGeografica} onChange={(e)=>setCiudadGeografica(e.target.value)}/></FieldWrap><FieldWrap label="Estado"><TextInput value={datosGenerales.estado} disabled/></FieldWrap><FieldWrap label="Vendedor"><TextInput value={datosGenerales.vendedorNombre} disabled/></FieldWrap></div></Card>
      {estructura&&<Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Capacidad operativa · {estructura.region}</p><h3 className="mt-1 font-semibold">{estructura.ciudad}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${estructura.rotacionPct>=1?"bg-danger-50 text-danger-700":"bg-warning-50 text-warning-700"}`}>Rotación operativa {(estructura.rotacionPct*100).toFixed(1)}%</span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 text-sm"><div><p className="text-xs text-ink-500">Sup.</p><b>{estructura.supervisores}</b></div><div><p className="text-xs text-ink-500">Co RH</p><b>{estructura.coordinadoresRh}</b></div><div><p className="text-xs text-ink-500">Rec SR</p><b>{estructura.reclutadoresSr}</b></div><div><p className="text-xs text-ink-500">Rec.</p><b>{estructura.reclutadores}</b></div><div><p className="text-xs text-ink-500">HC actual</p><b>{estructura.hc}</b></div><div><p className="text-xs text-ink-500">Bajas</p><b>{estructura.bajas}</b></div><div><p className="text-xs text-ink-500">HC/Sup</p><b>{estructura.hcPorSupervisor.toFixed(1)}</b></div><div><p className="text-xs text-ink-500">Personas/Rec</p><b>{estructura.personasPorReclutador.toFixed(1)}</b></div></div>{simulacionEstructura&&<div className="mt-4 rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm"><b>Impacto del nuevo servicio:</b> HC proyectado {simulacionEstructura.hcProyectado}. {simulacionEstructura.supNecesarios>0?`Se sugiere validar ${simulacionEstructura.supNecesarios} supervisor adicional. `:"Sin supervisor adicional sugerido por la referencia actual. "}{simulacionEstructura.recNecesarios>0?`Se sugiere validar ${simulacionEstructura.recNecesarios} reclutador adicional.`:"Sin reclutador adicional sugerido."}<p className="mt-1 text-[11px] text-ink-500">Simulación demo basada en ratios actuales de la tabla de Estructura IC; Pricing debe validar los umbrales definitivos.</p></div>}</Card>}
    </div>}

    {step===1&&<div className="space-y-5">{puestos.map((p,idx)=>{const benchmark=benchmarkPara(datosGenerales.ciudad,p.tipoPuesto);const req=PERFIL_REQUISITOS[p.nivelPerfil??"A"];const cp=costosPorPuesto[p.id]??VACIO;return <Card key={p.id} className="p-5"><div className="mb-4 flex items-center justify-between"><div><p className="font-semibold">Puesto {idx+1}</p><p className="text-xs text-ink-500">{req.etiqueta} · {req.experiencia}</p></div>{puestos.length>1&&<button className="text-xs text-danger-600" onClick={()=>removePuesto(p.id)}>Quitar</button>}</div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><FieldWrap label="Tipo de puesto"><SelectInput value={p.tipoPuesto} onChange={(e)=>{const tipo=e.target.value as PerfilPuesto;const base=benchmarkPara(datosGenerales.ciudad,tipo)?.recomendado??defaultSalario(tipo,datosGenerales.ciudad);updatePuesto(p.id,{tipoPuesto:tipo,salarioMensual:salarioPorNivel(base,p.nivelPerfil??"A")});}}>{PERFILES_COTIZADOR.map((x)=><option key={x.id} value={x.value}>{x.label}</option>)}</SelectInput></FieldWrap><FieldWrap label="Perfil / nivel"><SelectInput value={p.nivelPerfil??"A"} onChange={(e)=>changeNivel(p.id,e.target.value as NivelPerfil)}>{NIVELES.map((n)=><option key={n} value={n}>Perfil {n}</option>)}</SelectInput></FieldWrap><FieldWrap label="Posiciones"><TextInput type="number" min={1} value={p.cantidadPosiciones} onChange={(e)=>updatePuesto(p.id,{cantidadPosiciones:Number(e.target.value)})}/></FieldWrap><FieldWrap label="Turno / cobertura"><SelectInput value={p.cobertura} onChange={(e)=>{const t=TURNOS_DEMO.find((x)=>x.id===e.target.value);updatePuesto(p.id,{cobertura:e.target.value as PuestoCotizado["cobertura"],horas:t?.horas??p.horas,dias:t?.diasSemana??p.dias});}}>{TURNOS_DEMO.map((t)=><option key={t.id} value={t.id}>{t.label}</option>)}</SelectInput></FieldWrap><FieldWrap label="Salario mensual"><TextInput type="number" value={p.salarioMensual} onChange={(e)=>updatePuesto(p.id,{salarioMensual:Number(e.target.value)})}/></FieldWrap></div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-ink-200 bg-ink-50 p-4"><p className="text-xs font-semibold uppercase text-ink-600">Perfil {p.nivelPerfil??"A"}</p><p className="mt-2 text-sm">Escolaridad: <b>{req.escolaridad}</b> · Experiencia: <b>{req.experiencia}</b></p><p className="mt-2 text-xs text-ink-500">{req.habilidades.join(" · ")}</p></div><div className="rounded-xl border border-brand-200 bg-brand-50 p-4"><p className="text-xs font-semibold uppercase text-brand-700">Benchmark salarial</p>{benchmark?<div className="mt-2 grid grid-cols-4 gap-2 text-sm"><div>P25<br/><b>{money(benchmark.p25)}</b></div><div>P50<br/><b>{money(benchmark.p50)}</b></div><div>P75<br/><b>{money(benchmark.p75)}</b></div><div>Base<br/><b>{money(benchmark.recomendado)}</b></div><p className="col-span-4 text-[11px] text-ink-500">Rotación salarial ref. {(benchmark.rotacionPct*100).toFixed(1)}% · {benchmark.fuente}</p></div>:<p className="mt-2 text-xs">Sin benchmark consolidado.</p>}</div></div>
      <div className="mt-4 rounded-xl border border-ink-200 p-4"><p className="text-sm font-semibold">Exámenes requeridos</p><p className="text-xs text-ink-500">Los especializados deben validar costo y periodicidad.</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{EXAMENES_DEMO.map((e)=><label key={e.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${(p.examenes??[]).includes(e.id)?"border-brand-300 bg-brand-50":"border-ink-200"}`}><input type="checkbox" checked={(p.examenes??[]).includes(e.id)} onChange={()=>toggleExamen(p.id,e.id)}/><span>{e.nombre}{e.requiereValidacion?<small className="block text-warning-700">Especializado · validar</small>:<small className="block text-ink-400">Básico</small>}</span></label>)}</div>{(p.examenes??[]).some((x)=>EXAMENES_DEMO.find((e)=>e.id===x)?.requiereValidacion)&&<div className="mt-3"><FieldWrap label="Costo mensualizado estimado de exámenes especializados" hint="Se incluye en el cálculo y queda pendiente de validación"><TextInput type="number" min={0} value={p.costoExamenesMensualizado||""} onChange={(e)=>updatePuesto(p.id,{costoExamenesMensualizado:Number(e.target.value)})}/></FieldWrap></div>}</div>
      <div className="mt-4 space-y-3"><CatalogCostConfigurator tipo="UNIFORME" titulo="Uniformes" selecciones={cp.uniformes} onChange={(items)=>syncCostos(p.id,{...cp,uniformes:items})}/><CatalogCostConfigurator tipo="EQUIPO" titulo="Equipamiento" selecciones={cp.equipos} onChange={(items)=>syncCostos(p.id,{...cp,equipos:items})}/><CatalogCostConfigurator tipo="VEHICULO" titulo="Vehículos" selecciones={cp.vehiculos} onChange={(items)=>syncCostos(p.id,{...cp,vehiculos:items})}/></div>
    </Card>;})}<Button variant="secondary" onClick={addPuesto}>+ Agregar puesto</Button><Card className="p-4"><p className="text-xs font-semibold uppercase text-ink-600">Benchmark externo 2026</p>{BENCHMARK_EXTERNO_REFERENCIA.map((b)=><p key={b.proveedor} className="mt-2 text-sm"><b>{b.proveedor}</b> · {b.plaza} · salario {money(b.salario2026)} · tarifa {money(b.tarifa2026)} · factor {b.factor.toFixed(2)}</p>)}</Card></div>}

    {step===2&&<div className="space-y-4"><Card className="p-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><FieldWrap label="Gross Margin objetivo"><TextInput type="number" step="0.1" value={Math.round(parametros.grossMarginObjetivo*1000)/10} onChange={(e)=>setParametros({...parametros,grossMarginObjetivo:Number(e.target.value)/100})}/></FieldWrap><FieldWrap label="Moneda"><SelectInput value={parametros.moneda??"MXN"} onChange={(e)=>setParametros({...parametros,moneda:e.target.value as "MXN"|"USD"})}><option value="MXN">MXN</option><option value="USD">USD</option></SelectInput></FieldWrap><FieldWrap label="Tipo de cambio USD/MXN" hint="Captura manual para esta consulta"><TextInput type="number" step="0.01" min={0} value={parametros.tipoCambioUsdMxn??""} onChange={(e)=>setParametros({...parametros,tipoCambioUsdMxn:Number(e.target.value)})}/></FieldWrap><FieldWrap label="Vigencia propuesta"><TextInput type="number" value={parametros.vigenciaPropuestaDias} onChange={(e)=>setParametros({...parametros,vigenciaPropuestaDias:Number(e.target.value)})}/></FieldWrap></div></Card>
      <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase text-brand-700">Resumen de costos</p><h3 className="font-semibold">Mensual y anual</h3></div><span className="rounded-full bg-ink-100 px-3 py-1 text-xs">Gross Comp V0.5</span></div><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><div><p className="text-xs text-ink-500">Costo mensual IC</p><p className="text-lg font-semibold">{money(preview.costoMensualTotal)}</p></div><div><p className="text-xs text-ink-500">Costo anual IC</p><p className="text-lg font-semibold">{money(preview.costoAnualTotal??0)}</p></div><div><p className="text-xs text-ink-500">Precio mensual</p><p className="text-lg font-semibold text-brand-700">{money(preview.precioMensualTotal)}</p></div><div><p className="text-xs text-ink-500">Precio anual</p><p className="text-lg font-semibold text-brand-700">{money(preview.precioAnualTotal??0)}</p></div>{preview.precioMensualUsd!==undefined&&<><div><p className="text-xs text-ink-500">Precio mensual USD</p><p className="font-semibold">{money(preview.precioMensualUsd,"USD")}</p></div><div><p className="text-xs text-ink-500">Precio anual USD</p><p className="font-semibold">{money(preview.precioAnualUsd??0,"USD")}</p></div></>}</div></Card>
      {preview.puestos.map((pc,idx)=><Card key={pc.id} className="p-5"><p className="font-semibold">Gross Comp · Puesto {idx+1} · Perfil {pc.nivelPerfil??"A"}</p>{pc.desgloseLaboral&&<div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-7"><div><small>Sueldo</small><br/><b>{money(pc.desgloseLaboral.sueldoBaseMensual)}</b></div><div><small>Aguinaldo</small><br/><b>{money(pc.desgloseLaboral.aguinaldoMensualizado)}</b></div><div><small>Vacaciones</small><br/><b>{money(pc.desgloseLaboral.vacacionesMensualizadas)}</b></div><div><small>Prima vac.</small><br/><b>{money(pc.desgloseLaboral.primaVacacionalMensualizada)}</b></div><div><small>ISN</small><br/><b>{money(pc.desgloseLaboral.isn)}</b></div><div><small>Riesgo</small><br/><b>{money(pc.desgloseLaboral.riesgoTrabajo)}</b></div><div><small>Otras cargas</small><br/><b>{money(pc.desgloseLaboral.cargaSocialReferencia)}</b></div></div>}<p className="mt-3 text-xs text-warning-700">El residual “Otras cargas” mantiene la referencia de carga social del modelo demo mientras terminamos la paridad detallada IMSS/INFONAVIT contra Gross Comp.</p></Card>)}
      <Card className="p-5"><FieldWrap label="Observaciones"><TextArea rows={3} value={parametros.observaciones} onChange={(e)=>setParametros({...parametros,observaciones:e.target.value})}/></FieldWrap></Card>
    </div>}

    <div className="flex items-center justify-between pt-2"><Button variant="secondary" onClick={()=>setStep((s)=>Math.max(0,s-1))} disabled={step===0}>Atrás</Button><div className="flex gap-2"><Button variant="ghost" onClick={handleSaveDraft}>Guardar borrador</Button>{step<STEPS.length-1?<Button onClick={()=>setStep((s)=>Math.min(STEPS.length-1,s+1))} disabled={!canAdvance()}>Siguiente</Button>:<Button onClick={handleCalcular}>Calcular cotización</Button>}</div></div>
  </div>;
}
