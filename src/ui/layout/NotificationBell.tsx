import { useEffect, useRef, useState } from "react";
import { listNotifications, markAllAsRead, markAsRead, refreshVigenciaNotifications, unreadCount } from "../../modules/notification-service";
import type { NotificationItem } from "../../types";
import { formatDateTimeEs } from "../../lib/ids";

const SEVERITY_DOT: Record<NotificationItem["severity"], string> = {
  info: "bg-brand-500",
  warning: "bg-warning-500",
  critical: "bg-danger-500",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  function reload() {
    refreshVigenciaNotifications();
    setItems(listNotifications());
    setCount(unreadCount());
  }

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          reload();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-600 hover:bg-ink-100"
        aria-label="Centro de notificaciones"
      >
        <span className="text-base">🔔</span>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border border-ink-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Centro de notificaciones</p>
            <button
              className="text-xs font-medium text-brand-600 hover:underline"
              onClick={() => {
                markAllAsRead();
                reload();
              }}
            >
              Marcar todo leído
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-6 text-center text-xs text-ink-500">Sin notificaciones.</p>}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markAsRead(n.id);
                  reload();
                }}
                className={`block w-full border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-ink-50 ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[n.severity]}`} />
                  <div>
                    <p className="text-xs font-semibold text-ink-900">{n.title}</p>
                    <p className="mt-0.5 text-xs text-ink-600">{n.message}</p>
                    <p className="mt-1 text-[11px] text-ink-400">{formatDateTimeEs(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
