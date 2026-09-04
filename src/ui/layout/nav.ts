import type { AppSection } from "../../modules/auth/roles";

export interface NavItem {
  section: AppSection;
  label: string;
  to: string;
  icon: string; // simple inline glyph, keeps the demo dependency-free
}

export const NAV_ITEMS: NavItem[] = [
  { section: "dashboard", label: "Dashboard", to: "/dashboard", icon: "▦" },
  { section: "cotizaciones", label: "Cotizaciones", to: "/cotizaciones", icon: "▤" },
  { section: "nuevaCotizacion", label: "Nueva Cotización", to: "/nueva-cotizacion", icon: "＋" },
  { section: "misCotizaciones", label: "Mis Cotizaciones", to: "/mis-cotizaciones", icon: "▤" },
  { section: "validaciones", label: "Centro de Validaciones", to: "/validaciones", icon: "⚑" },
  { section: "catalogos", label: "Catálogos", to: "/catalogos", icon: "▥" },
  { section: "benchmark", label: "Benchmark", to: "/benchmark", icon: "◈" },
  { section: "usuarios", label: "Usuarios", to: "/usuarios", icon: "◍" },
  { section: "auditoria", label: "Auditoría", to: "/auditoria", icon: "◷" },
  { section: "configuracion", label: "Configuración", to: "/configuracion", icon: "⚙" },
];
