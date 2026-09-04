// ============================================================================
// notification-service
// ----------------------------------------------------------------------------
// Computes vigencia alerts for catalog items ("expires in N days") and
// exposes an in-app notification center. The `channel` field on each
// NotificationItem is deliberately modeled ("in_app" | "outlook" | "teams")
// so that wiring a real Outlook/Teams connector later is additive: this
// service already produces the payloads, only the delivery adapter is
// missing on purpose for this demo.
// ============================================================================

import { notificationsRepo, catalogItemsRepo } from "../../data/db";
import { getVigenciaEstado } from "../catalog-service";
import { newId, nowIso } from "../../lib/ids";
import type { NotificationItem } from "../../types";

/** Scans all active catalog items and creates/refreshes vigencia notifications. */
export function refreshVigenciaNotifications(today: Date = new Date()): NotificationItem[] {
  const items = catalogItemsRepo.getAll().filter((i) => i.activo);
  const existing = notificationsRepo.getAll();
  const created: NotificationItem[] = [];

  items.forEach((item) => {
    const estado = getVigenciaEstado(item, today);
    if (estado !== "PROXIMO_A_VENCER" && estado !== "VENCIDO") return;

    const alreadyExists = existing.some(
      (n) => n.relatedCatalogItemId === item.id && n.message.includes(item.fechaVencimiento)
    );
    if (alreadyExists) return;

    const severity = estado === "VENCIDO" ? "critical" : "warning";
    const verbo = estado === "VENCIDO" ? "venció" : "vencerá";
    const notif: NotificationItem = {
      id: newId(),
      title: estado === "VENCIDO" ? "Catálogo vencido" : "Catálogo próximo a vencer",
      message: `El catálogo ${item.nombre} - ${item.ubicacion} ${verbo} el ${formatShort(item.fechaVencimiento)}.`,
      severity,
      createdAt: nowIso(),
      read: false,
      relatedCatalogItemId: item.id,
      channel: "in_app",
    };
    notificationsRepo.create(notif);
    created.push(notif);
  });

  return created;
}

export function listNotifications(): NotificationItem[] {
  return notificationsRepo.getAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function unreadCount(): number {
  return notificationsRepo.getAll().filter((n) => !n.read).length;
}

export function markAsRead(id: string): void {
  notificationsRepo.update(id, { read: true });
}

export function markAllAsRead(): void {
  notificationsRepo.getAll().forEach((n) => {
    if (!n.read) notificationsRepo.update(n.id, { read: true });
  });
}

function formatShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}
