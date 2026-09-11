import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { ROLES } from "../../modules/auth/roles";
import { NotificationBell } from "./NotificationBell";

export function Topbar({title,onOpenMenu}:{title:string;onOpenMenu:()=>void}){
  const {currentUser,allUsers,loginAs,logout}=useAuth();
  const [switching,setSwitching]=useState(false);
  const navigate=useNavigate();
  if(!currentUser)return null;

  return <header className="pm-glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/70 px-4 shadow-[0_8px_24px_rgba(13,31,55,.04)] md:px-7">
    <div className="flex items-center gap-3">
      <button onClick={onOpenMenu} className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 shadow-sm hover:bg-ink-50 lg:hidden" aria-label="Abrir menú">☰</button>
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-500">Price Model 365</p><h1 className="mt-0.5 text-base font-semibold tracking-[-0.02em] text-brand-800 md:text-lg">{title}</h1></div>
    </div>

    <div className="flex items-center gap-2.5">
      <div className="hidden rounded-full border border-success-500/15 bg-success-50 px-3 py-1.5 text-[11px] font-semibold text-success-600 md:block">● Modelo activo</div>
      <NotificationBell/>
      <div className="relative">
        <button onClick={()=>setSwitching(v=>!v)} className="flex items-center gap-2.5 rounded-xl border border-ink-200/80 bg-white px-2.5 py-1.5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-[11px] font-bold text-white">{initials(currentUser.fullName)}</span>
          <span className="hidden text-left sm:block"><span className="block max-w-36 truncate text-xs font-semibold text-ink-800">{currentUser.fullName}</span><span className="block text-[10px] text-ink-400">{ROLES[currentUser.role].label}</span></span>
          <span className="text-xs text-ink-400">⌄</span>
        </button>
        {switching&&<div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_18px_50px_rgba(13,31,55,.16)]">
          <p className="border-b border-ink-100 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Cambiar usuario demo</p>
          <div className="max-h-72 overflow-y-auto py-1">{allUsers.filter(u=>u.active).map(u=><button key={u.id} onClick={()=>{loginAs(u.id);setSwitching(false);navigate("/dashboard");}} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50 ${u.id===currentUser.id?"bg-brand-50":""}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-[10px] font-bold text-brand-800">{initials(u.fullName)}</span><span><span className="block text-xs font-semibold text-ink-900">{u.fullName}</span><span className="block text-[10px] text-ink-500">{ROLES[u.role].label}</span></span></button>)}</div>
          <div className="border-t border-ink-100 p-2"><button onClick={()=>{logout();setSwitching(false);navigate("/login");}} className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-danger-600 hover:bg-danger-50">Cerrar sesión</button></div>
        </div>}
      </div>
    </div>
  </header>;
}
function initials(name:string){return name.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();}
