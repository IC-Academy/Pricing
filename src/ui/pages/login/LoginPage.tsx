import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { ROLES } from "../../../modules/auth/roles";

export function LoginPage(){
  const {allUsers,loginAs}=useAuth();
  const navigate=useNavigate();
  const groups=[
    {role:"SUPERADMIN",users:allUsers.filter(u=>u.role==="SUPERADMIN")},
    {role:"ADMIN_FUNCIONAL",users:allUsers.filter(u=>u.role==="ADMIN_FUNCIONAL")},
    {role:"PRICING",users:allUsers.filter(u=>u.role==="PRICING")},
    {role:"VENTAS",users:allUsers.filter(u=>u.role==="VENTAS")},
  ];
  function handleLogin(userId:string){loginAs(userId);navigate("/dashboard");}

  return <div className="relative min-h-screen overflow-hidden bg-brand-900 px-4 py-8 text-white md:px-8">
    <div className="pointer-events-none absolute -left-28 -top-24 h-80 w-80 rounded-full bg-brand-400/16 blur-3xl"/>
    <div className="pointer-events-none absolute -bottom-24 right-[-40px] h-96 w-96 rounded-full bg-accent-500/13 blur-3xl"/>
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-[0_30px_100px_rgba(0,0,0,.30)] backdrop-blur-xl lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-white/8 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(254,197,42,.13),transparent_28rem)]"/>
        <div className="relative">
          <div className="flex items-center gap-3"><img src="/Pricing/price-model-mark.svg" alt="Price Model" className="h-12 w-12 rounded-2xl shadow-[0_14px_34px_rgba(0,0,0,.24)]"/><div><p className="text-base font-semibold">Price Model</p><p className="text-[10px] font-medium uppercase tracking-[.18em] text-white/40">Inter-Con · Pricing Intelligence</p></div></div>
          <div className="mt-24 max-w-xl"><div className="mb-5 h-1 w-14 rounded-full bg-accent-500"/><h1 className="text-4xl font-semibold leading-[1.08] tracking-[-.05em] xl:text-5xl">Más que números,<br/><span className="text-accent-500">seguridad para decidir.</span></h1><p className="mt-6 max-w-lg text-sm leading-7 text-white/52">Cotizaciones construidas con benchmark, estructura operativa, Gross Comp, catálogos vigentes y reglas de validación en una sola experiencia.</p></div>
        </div>
        <div className="relative grid grid-cols-3 gap-3"><Feature icon="⌁" title="Cotiza rápido"/><Feature icon="✓" title="Valida con control"/><Feature icon="↗" title="Decide con datos"/></div>
      </section>

      <section className="flex items-center justify-center bg-white px-4 py-8 text-ink-900 sm:px-8 lg:px-10 xl:px-14">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><img src="/Pricing/price-model-mark.svg" alt="Price Model" className="h-11 w-11 rounded-2xl"/><div><p className="text-sm font-semibold text-brand-800">Price Model</p><p className="text-[10px] uppercase tracking-[.14em] text-ink-400">Pricing Intelligence</p></div></div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-brand-500">Acceso demo</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em] text-brand-800">Selecciona tu perfil</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">La versión productiva utilizará identidad corporativa. Para esta demo puedes cambiar entre roles y validar la experiencia completa.</p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">{groups.map(group=><div key={group.role} className="rounded-2xl border border-ink-100 bg-ink-50/55 p-3.5"><div className="mb-2.5 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-brand-700">{ROLES[group.role as keyof typeof ROLES].label}</p><span className="h-1.5 w-1.5 rounded-full bg-accent-500"/></div><div className="space-y-2">{group.users.map(u=><button key={u.id} onClick={()=>handleLogin(u.id)} className="group flex w-full items-center gap-3 rounded-xl border border-white bg-white px-3 py-2.5 text-left shadow-[0_6px_18px_rgba(13,31,55,.05)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_10px_26px_rgba(13,31,55,.09)]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[10px] font-bold text-brand-700">{initials(u.fullName)}</span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-ink-900">{u.fullName}</span>{u.cargo&&<span className="mt-0.5 block truncate text-[10px] text-ink-400">{u.cargo}</span>}</span><span className="ml-auto text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500">→</span></button>)}</div></div>)}</div>

          <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-4"><div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-xs text-accent-500">i</span><div><p className="text-xs font-semibold text-brand-800">Entorno de demostración</p><p className="mt-1 text-[11px] leading-5 text-ink-500">Los datos permanecen locales. No se utilizan credenciales ni información productiva real.</p></div></div></div>
        </div>
      </section>
    </div>
  </div>;
}
function initials(name:string){return name.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();}
function Feature({icon,title}:{icon:string;title:string}){return <div className="rounded-2xl border border-white/8 bg-white/5 p-4"><div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/7 text-sm text-accent-500">{icon}</div><p className="text-[11px] font-semibold text-white/72">{title}</p></div>}
