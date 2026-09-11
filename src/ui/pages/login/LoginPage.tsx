import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { ROLES } from "../../../modules/auth/roles";

const ROLE_ORDER=["SUPERADMIN","ADMIN_FUNCIONAL","PRICING","VENTAS"] as const;

export function LoginPage(){
  const {allUsers,loginAs}=useAuth();
  const navigate=useNavigate();
  const [activeRole,setActiveRole]=useState<(typeof ROLE_ORDER)[number]>("VENTAS");

  const users=useMemo(()=>allUsers.filter(u=>u.role===activeRole&&u.active),[allUsers,activeRole]);
  const selectedRole=ROLES[activeRole];

  function handleLogin(userId:string){loginAs(userId);navigate("/dashboard");}

  return <div className="relative min-h-screen overflow-hidden bg-brand-900 text-white">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(254,197,42,.14),transparent_28rem),radial-gradient(circle_at_85%_90%,rgba(91,144,192,.18),transparent_30rem)]"/>
    <div className="pointer-events-none absolute right-[-8rem] top-[-7rem] h-[28rem] w-[28rem] rounded-full border border-white/5"/>
    <div className="pointer-events-none absolute right-[-3rem] top-[-2rem] h-[18rem] w-[18rem] rounded-full border border-white/5"/>

    <div className="relative mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden px-12 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-12">
        <div>
          <div className="flex items-center gap-3">
            <img src="/Pricing/price-model-mark.svg" alt="Price Model" className="h-12 w-12 rounded-2xl shadow-[0_14px_38px_rgba(0,0,0,.28)]"/>
            <div><p className="text-base font-semibold tracking-[-.02em]">Price Model</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">Inter-Con · Pricing Intelligence</p></div>
          </div>

          <div className="mt-28 max-w-2xl xl:mt-36">
            <div className="mb-6 flex items-center gap-3"><span className="h-1 w-14 rounded-full bg-accent-500"/><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/40">Operational Pricing</span></div>
            <h1 className="text-[44px] font-semibold leading-[1.04] tracking-[-.055em] xl:text-[58px]">De una necesidad operativa<br/><span className="text-accent-500">a una decisión comercial.</span></h1>
            <p className="mt-7 max-w-xl text-[15px] leading-7 text-white/48">Centraliza benchmark, estructura operativa, Gross Comp, catálogos y validaciones para construir cotizaciones consistentes, trazables y listas para revisión.</p>
          </div>
        </div>

        <div>
          <div className="grid max-w-2xl grid-cols-3 gap-3">
            <Feature metric="72 h" label="Dimensionamiento operativo"/>
            <Feature metric="360°" label="Visibilidad de costos"/>
            <Feature metric="1 flujo" label="Venta → Pricing → Propuesta"/>
          </div>
          <p className="mt-7 text-[10px] font-medium uppercase tracking-[.16em] text-white/24">Inter-Con Servicios de Seguridad Privada · México</p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-white px-4 py-8 text-ink-900 sm:px-8 lg:rounded-l-[34px] lg:px-12 xl:px-16">
        <div className="w-full max-w-[620px]">
          <div className="mb-9 flex items-center gap-3 lg:hidden"><img src="/Pricing/price-model-mark.svg" alt="Price Model" className="h-12 w-12 rounded-2xl"/><div><p className="text-base font-semibold text-brand-800">Price Model</p><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-ink-400">Pricing Intelligence</p></div></div>

          <div className="flex items-center justify-between gap-4">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-brand-500">Acceso al entorno</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-brand-800">Bienvenido a Price Model</h2><p className="mt-2 max-w-lg text-sm leading-6 text-ink-500">Selecciona un perfil para recorrer la experiencia de acuerdo con sus permisos y responsabilidades.</p></div>
            <span className="hidden rounded-full border border-success-500/15 bg-success-50 px-3 py-1.5 text-[10px] font-semibold text-success-600 sm:block">● Demo activa</span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-ink-50 p-1.5 sm:grid-cols-4">
            {ROLE_ORDER.map(role=><button key={role} onClick={()=>setActiveRole(role)} className={`rounded-xl px-3 py-2.5 text-[10px] font-semibold transition ${activeRole===role?"bg-white text-brand-700 shadow-[0_5px_16px_rgba(13,31,55,.08)] ring-1 ring-ink-100":"text-ink-400 hover:text-ink-700"}`}>{shortRole(role)}</button>)}
          </div>

          <div className="mt-5 rounded-[24px] border border-ink-100 bg-white p-4 shadow-[0_18px_50px_rgba(13,31,55,.07)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-brand-800">{selectedRole.label}</p><p className="mt-1 text-[11px] text-ink-400">{roleDescription(activeRole)}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-sm text-brand-700">{roleIcon(activeRole)}</div></div>

            <div className="space-y-2.5">{users.map(u=><button key={u.id} onClick={()=>handleLogin(u.id)} className="group flex w-full items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50/45 px-3.5 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/60 hover:shadow-[0_12px_30px_rgba(13,31,55,.08)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(0,42,92,.18)]">{initials(u.fullName)}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink-900">{u.fullName}</span>{u.cargo&&<span className="mt-0.5 block truncate text-[11px] text-ink-400">{u.cargo}</span>}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-ink-300 ring-1 ring-ink-100 transition group-hover:bg-brand-700 group-hover:text-accent-500">→</span>
            </button>)}</div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/65 px-4 py-3.5"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-[10px] font-bold text-accent-500">i</span><div><p className="text-[11px] font-semibold text-brand-800">Entorno demostrativo seguro</p><p className="mt-1 text-[10px] leading-5 text-ink-500">Esta versión utiliza datos locales y usuarios simulados. La versión productiva utilizará identidad corporativa y permisos administrados.</p></div></div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-5 text-[10px] text-ink-300"><span>Price Model 365 · FY2026</span><span>Pricing Intelligence Platform</span></div>
        </div>
      </section>
    </div>
  </div>;
}

function initials(name:string){return name.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();}
function shortRole(role:(typeof ROLE_ORDER)[number]){if(role==="SUPERADMIN")return"Superadmin";if(role==="ADMIN_FUNCIONAL")return"Administrador";if(role==="PRICING")return"Pricing";return"Ventas";}
function roleDescription(role:(typeof ROLE_ORDER)[number]){if(role==="SUPERADMIN")return"Gobierno técnico, configuración y supervisión del modelo.";if(role==="ADMIN_FUNCIONAL")return"Control funcional del Price Model y parámetros de Pricing.";if(role==="PRICING")return"Validación de excepciones, ajustes y liberación de cotizaciones.";return"Creación rápida de cotizaciones y seguimiento comercial.";}
function roleIcon(role:(typeof ROLE_ORDER)[number]){if(role==="SUPERADMIN")return"⌘";if(role==="ADMIN_FUNCIONAL")return"◆";if(role==="PRICING")return"↗";return"＋";}
function Feature({metric,label}:{metric:string;label:string}){return <div className="rounded-2xl border border-white/8 bg-white/[.045] p-4 backdrop-blur-sm"><p className="text-xl font-semibold tracking-[-.03em] text-accent-500">{metric}</p><p className="mt-1.5 text-[10px] leading-4 text-white/42">{label}</p></div>}
