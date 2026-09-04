import type { ReactNode } from "react";

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-500 hover:bg-ink-100" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-ink-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  widthClass = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div className={`relative flex max-h-[90vh] w-full ${widthClass} flex-col rounded-lg bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-500 hover:bg-ink-100" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-ink-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
