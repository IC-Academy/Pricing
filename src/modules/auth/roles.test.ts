import { describe, expect, it } from "vitest";
import {
  canAccessSection,
  canCreateQuotation,
  canEditCatalog,
  canManageGlobalConfig,
  canManageUsers,
  canResolveExceptions,
  canViewAuditoria,
  isAdminLike,
  navSectionsForRole,
} from "./roles";
import { EMPTY_PRICING_PERMISSIONS } from "../../types";
import type { User } from "../../types";

function pricingUser(overrides: Partial<User> = {}): User {
  return {
    id: "u-pricing",
    fullName: "Pricing Demo",
    email: "pricing@intercon.com.mx",
    role: "PRICING",
    active: true,
    permissions: { ...EMPTY_PRICING_PERMISSIONS },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function ventasUser(overrides: Partial<User> = {}): User {
  return {
    id: "u-ventas",
    fullName: "Ventas Demo",
    email: "ventas@intercon.com.mx",
    role: "VENTAS",
    active: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("auth/roles — navigation & section access", () => {
  it("gives Ventas only Dashboard, Nueva Cotización and Mis Cotizaciones", () => {
    const sections = navSectionsForRole("VENTAS");
    expect(sections).toEqual(["dashboard", "nuevaCotizacion", "misCotizaciones"]);
  });

  it("blocks Ventas from Configuración", () => {
    expect(canAccessSection("VENTAS", "configuracion")).toBe(false);
  });

  it("blocks Ventas from Catálogos, Usuarios and Auditoría", () => {
    expect(canAccessSection("VENTAS", "catalogos")).toBe(false);
    expect(canAccessSection("VENTAS", "usuarios")).toBe(false);
    expect(canAccessSection("VENTAS", "auditoria")).toBe(false);
  });

  it("gives Admin and Pricing access to Configuración/Catálogos/Auditoría sections", () => {
    for (const role of ["SUPERADMIN", "ADMIN_FUNCIONAL", "PRICING"] as const) {
      expect(canAccessSection(role, "configuracion")).toBe(true);
      expect(canAccessSection(role, "catalogos")).toBe(true);
      expect(canAccessSection(role, "auditoria")).toBe(true);
    }
  });
});

describe("auth/roles — admin-like permissions", () => {
  it("only Superadmin can manage global config", () => {
    expect(canManageGlobalConfig("SUPERADMIN")).toBe(true);
    expect(canManageGlobalConfig("ADMIN_FUNCIONAL")).toBe(false);
    expect(canManageGlobalConfig("PRICING")).toBe(false);
    expect(canManageGlobalConfig("VENTAS")).toBe(false);
  });

  it("Superadmin and Admin Funcional can manage users; Pricing and Ventas cannot", () => {
    expect(canManageUsers("SUPERADMIN")).toBe(true);
    expect(canManageUsers("ADMIN_FUNCIONAL")).toBe(true);
    expect(canManageUsers("PRICING")).toBe(false);
    expect(canManageUsers("VENTAS")).toBe(false);
  });

  it("isAdminLike is true only for Superadmin/Admin Funcional", () => {
    expect(isAdminLike("SUPERADMIN")).toBe(true);
    expect(isAdminLike("ADMIN_FUNCIONAL")).toBe(true);
    expect(isAdminLike("PRICING")).toBe(false);
    expect(isAdminLike("VENTAS")).toBe(false);
  });
});

describe("auth/roles — catalog edit permissions (configurable per Pricing user)", () => {
  it("Ventas can never edit any catalog, regardless of type", () => {
    const ventas = ventasUser();
    expect(canEditCatalog(ventas, "SALARIOS")).toBe(false);
    expect(canEditCatalog(ventas, "IMPUESTOS")).toBe(false);
    expect(canEditCatalog(ventas, "UNIFORMES")).toBe(false);
    expect(canEditCatalog(ventas, "VEHICULOS")).toBe(false);
    expect(canEditCatalog(ventas, "EQUIPAMIENTO")).toBe(false);
  });

  it("Admin-like roles can edit every catalog type without explicit permissions", () => {
    const admin: User = { ...ventasUser(), role: "ADMIN_FUNCIONAL" };
    expect(canEditCatalog(admin, "SALARIOS")).toBe(true);
    expect(canEditCatalog(admin, "VEHICULOS")).toBe(true);
  });

  it("a Pricing user can edit only the catalog types explicitly granted", () => {
    const limited = pricingUser({ permissions: { ...EMPTY_PRICING_PERMISSIONS, editSalarios: true } });
    expect(canEditCatalog(limited, "SALARIOS")).toBe(true);
    expect(canEditCatalog(limited, "IMPUESTOS")).toBe(false);
    expect(canEditCatalog(limited, "UNIFORMES")).toBe(false);
  });

  it("a Pricing user with no permissions object behaves as having none granted", () => {
    const noPerms = pricingUser({ permissions: undefined });
    expect(canEditCatalog(noPerms, "SALARIOS")).toBe(false);
  });
});

describe("auth/roles — exceptions & audit visibility", () => {
  it("Pricing can resolve exceptions only when explicitly granted", () => {
    const granted = pricingUser({ permissions: { ...EMPTY_PRICING_PERMISSIONS, resolverExcepciones: true } });
    const notGranted = pricingUser({ permissions: { ...EMPTY_PRICING_PERMISSIONS, resolverExcepciones: false } });
    expect(canResolveExceptions(granted)).toBe(true);
    expect(canResolveExceptions(notGranted)).toBe(false);
  });

  it("Admin-like roles can always resolve exceptions and view auditoría", () => {
    const admin: User = { ...ventasUser(), role: "SUPERADMIN" };
    expect(canResolveExceptions(admin)).toBe(true);
    expect(canViewAuditoria(admin)).toBe(true);
  });

  it("Ventas can never resolve exceptions or view auditoría", () => {
    const ventas = ventasUser();
    expect(canResolveExceptions(ventas)).toBe(false);
    expect(canViewAuditoria(ventas)).toBe(false);
  });
});

describe("auth/roles — quotation creation", () => {
  it("Ventas and admin-like roles can create quotations; Pricing alone cannot", () => {
    expect(canCreateQuotation("VENTAS")).toBe(true);
    expect(canCreateQuotation("SUPERADMIN")).toBe(true);
    expect(canCreateQuotation("ADMIN_FUNCIONAL")).toBe(true);
    expect(canCreateQuotation("PRICING")).toBe(false);
  });
});
