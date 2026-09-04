// ============================================================================
// auth — role & permission definitions
// ----------------------------------------------------------------------------
// Central source of truth for what each role can do. UI components and
// route guards must check permissions through the functions here, never by
// inlining `user.role === "..."` checks scattered across screens.
// ============================================================================

import type { CatalogType, PricingPermissions, Role, RoleId, User } from "../../types";
import { EMPTY_PRICING_PERMISSIONS } from "../../types";

export const ROLES: Record<RoleId, Role> = {
  SUPERADMIN: {
    id: "SUPERADMIN",
    label: "Superadmin Técnico",
    description: "Acceso total: configuración global, parámetros, auditoría, usuarios y módulos técnicos.",
  },
  ADMIN_FUNCIONAL: {
    id: "ADMIN_FUNCIONAL",
    label: "Administrador Funcional",
    description: "Coordinador de Precios y Admon de Contratos. Administra usuarios, catálogos, vigencias y excepciones.",
  },
  PRICING: {
    id: "PRICING",
    label: "Pricing",
    description: "Revisa cotizaciones, resuelve excepciones y edita los catálogos para los que tenga permiso.",
  },
  VENTAS: {
    id: "VENTAS",
    label: "Ventas",
    description: "Crea cotizaciones, usa la calculadora y genera propuestas preliminares.",
  },
};

export type AppSection =
  | "dashboard"
  | "cotizaciones"
  | "nuevaCotizacion"
  | "misCotizaciones"
  | "validaciones"
  | "catalogos"
  | "benchmark"
  | "usuarios"
  | "auditoria"
  | "configuracion";

const NAV_ADMIN_PRICING: AppSection[] = [
  "dashboard",
  "cotizaciones",
  "validaciones",
  "catalogos",
  "benchmark",
  "usuarios",
  "auditoria",
  "configuracion",
];

const NAV_VENTAS: AppSection[] = ["dashboard", "nuevaCotizacion", "misCotizaciones"];

export function navSectionsForRole(role: RoleId): AppSection[] {
  if (role === "VENTAS") return NAV_VENTAS;
  return NAV_ADMIN_PRICING;
}

/** Central access matrix: which roles may view a given section at all. */
export function canAccessSection(role: RoleId, section: AppSection): boolean {
  return navSectionsForRole(role).includes(section);
}

export function isAdminLike(role: RoleId): boolean {
  return role === "SUPERADMIN" || role === "ADMIN_FUNCIONAL";
}

export function canManageUsers(role: RoleId): boolean {
  return isAdminLike(role);
}

export function canManageGlobalConfig(role: RoleId): boolean {
  return role === "SUPERADMIN";
}

export function canConfigureVigenciasYAlertas(role: RoleId): boolean {
  return isAdminLike(role);
}

export function canResolveExceptions(user: User): boolean {
  if (isAdminLike(user.role)) return true;
  if (user.role === "PRICING") return !!user.permissions?.resolverExcepciones;
  return false;
}

export function canViewAuditoria(user: User): boolean {
  if (isAdminLike(user.role)) return true;
  if (user.role === "PRICING") return !!user.permissions?.consultarAuditoria;
  return false;
}

const CATALOG_PERMISSION_KEY: Record<CatalogType, keyof PricingPermissions> = {
  SALARIOS: "editSalarios",
  IMPUESTOS: "editImpuestos",
  UNIFORMES: "editUniformes",
  VEHICULOS: "editVehiculos",
  EQUIPAMIENTO: "editEquipamiento",
};

/** Can this user create/edit/deactivate items of the given catalog type? */
export function canEditCatalog(user: User, catalogType: CatalogType): boolean {
  if (isAdminLike(user.role)) return true;
  if (user.role === "PRICING") {
    const perms = user.permissions ?? EMPTY_PRICING_PERMISSIONS;
    return !!perms[CATALOG_PERMISSION_KEY[catalogType]];
  }
  return false; // VENTAS never edits catalogs
}

export function canCreateQuotation(role: RoleId): boolean {
  return role === "VENTAS" || isAdminLike(role);
}
