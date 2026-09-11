import { NavLink } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { navSectionsForRole, ROLES } from "../../modules/auth/roles";
import { NAV_ITEMS } from "./nav";

export function Sidebar({onNavigate}:{onNavigate?:()=>void}){
  const {currentUser}=useAuth();
  if(!currentUser)return null;
  const allowed=new Set(navSectionsForRole(currentUser.role));
  const items=NAV_ITEMS.filter((item)=>allowed.has(item.section));

  return <div className="relative flex h-full flex-col overflow-hidden bg-brand-800 text-white">
    <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent-500/10 blur-3xl"/>
    <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-400/10 blur-3xl"/>

    <div className="relative flex items-center gap-3 px-5 py-6">
      <img src="/Pricing/price-model-mark.svg" alt="Price Model" className="h-10 w-10 rounded-xl shadow-[0_10px_24px_rgba(0,0,0,.18)]"/>
      <div>
        <p className="text-sm font-semibold tracking-[-0.01em]">Price Model</p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">Pricing Intelligence</p>
      </div>
    </div>

    <div className="mx-4 h-px bg-white/8"/>
    <nav className="relative flex-1 space-y-1 px-3 py-5">
      {items.map((item)=><NavLink key={item.section} to={item.to} onClick={onNavigate} className={({isActive})=>`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive?"bg-white text-brand-800 shadow-[0_8px_24px_rgba(0,0,0,.13)]":"text-white/68 hover:bg-white/8 hover:text-white"}`}>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/7 text-[13px] transition-colors group-hover:bg-white/12">{item.icon}</span>
        <span>{item.label}</span>
      </NavLink>)}
    </nav>

    <div className="relative m-3 rounded-2xl border border-white/10 bg-white/6 p-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 font-bold text-brand-800">{currentUser.fullName.split(" ").map(p=>p[0]).slice(0,2).join("")}</div>
        <div className="min-w-0"><p className="truncate text-xs font-semibold">{currentUser.fullName}</p><p className="mt-0.5 truncate text-[10px] text-white/45">{ROLES[currentUser.role].label}</p></div>
      </div>
    </div>
  </div>;
}
