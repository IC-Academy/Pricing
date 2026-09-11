import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NAV_ITEMS } from "./nav";

export function AppShell(){
  const [mobileOpen,setMobileOpen]=useState(false);
  const location=useLocation();
  const current=NAV_ITEMS.find(item=>location.pathname.startsWith(item.to));
  const title=current?.label??"Price Model 365";

  return <div className="flex h-screen w-full overflow-hidden bg-transparent">
    <aside className="hidden w-[272px] shrink-0 p-3 lg:block"><div className="h-full overflow-hidden rounded-[22px] shadow-[0_20px_60px_rgba(13,31,55,.16)]"><Sidebar/></div></aside>
    {mobileOpen&&<div className="fixed inset-0 z-50 flex lg:hidden"><div className="w-[290px] shrink-0 p-3"><div className="h-full overflow-hidden rounded-[22px] shadow-2xl"><Sidebar onNavigate={()=>setMobileOpen(false)}/></div></div><div className="flex-1 bg-brand-900/45 backdrop-blur-sm" onClick={()=>setMobileOpen(false)}/></div>}
    <div className="flex min-w-0 flex-1 flex-col">
      <Topbar title={title} onOpenMenu={()=>setMobileOpen(true)}/>
      <main className="flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-7"><div className="mx-auto w-full max-w-[1600px]"><Outlet/></div></main>
    </div>
  </div>;
}
