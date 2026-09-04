// ============================================================================
// Central data facade
// ----------------------------------------------------------------------------
// Every service (catalog-service, pricing-engine consumers, audit-service,
// etc.) reads/writes through the repositories exported here. This is the only
// file that should import LocalStorageRepository directly — everything else
// depends on the Repository<T> interface, so this file is the single seam
// to touch when local storage is later replaced by a real API/SQL/M365
// backend.
// ============================================================================

import { LocalStorageRepository, LocalStorageValue, clearAllPm365Storage } from "../lib/storage";
import type {
  User,
  CatalogItem,
  CatalogHistoryEntry,
  NotificationItem,
  Quotation,
  ValidationException,
  AuditLogEntry,
  GlobalConfig,
  BenchmarkEntry,
} from "../types";
import { buildSeedData } from "./seed";

export const usersRepo = new LocalStorageRepository<User>("users");
export const catalogItemsRepo = new LocalStorageRepository<CatalogItem>("catalogItems");
export const catalogHistoryRepo = new LocalStorageRepository<CatalogHistoryEntry>("catalogHistory");
export const notificationsRepo = new LocalStorageRepository<NotificationItem>("notifications");
export const quotationsRepo = new LocalStorageRepository<Quotation>("quotations");
export const exceptionsRepo = new LocalStorageRepository<ValidationException>("exceptions");
export const auditLogRepo = new LocalStorageRepository<AuditLogEntry>("auditLog");
export const benchmarkRepo = new LocalStorageRepository<BenchmarkEntry>("benchmark");

export const globalConfigStore = new LocalStorageValue<GlobalConfig>("globalConfig", {
  ultimaActualizacionModelo: new Date().toISOString(),
  defaultDiasAnticipacionAlerta: 30,
});

export const sessionStore = new LocalStorageValue<{ userId: string | null }>("session", { userId: null });

const seededFlag = new LocalStorageValue<boolean>("seeded", false);

/** Loads demo data if this is the first run (nothing persisted yet). */
export function ensureSeeded(): void {
  if (seededFlag.get()) return;
  resetDemoData();
}

/** Wipes everything and reloads fresh demo data. Used by "Restablecer datos demo". */
export function resetDemoData(): void {
  clearAllPm365Storage();
  const seed = buildSeedData();
  usersRepo.setAll(seed.users);
  catalogItemsRepo.setAll(seed.catalogItems);
  catalogHistoryRepo.setAll(seed.catalogHistory);
  notificationsRepo.setAll(seed.notifications);
  quotationsRepo.setAll(seed.quotations);
  exceptionsRepo.setAll(seed.exceptions);
  auditLogRepo.setAll(seed.auditLog);
  benchmarkRepo.setAll(seed.benchmark);
  globalConfigStore.set(seed.globalConfig);
  sessionStore.set({ userId: null });
  seededFlag.set(true);
}
