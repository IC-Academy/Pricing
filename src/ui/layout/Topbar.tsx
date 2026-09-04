import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { ROLES } from "../../modules/auth/roles";
import { NotificationBell } from "./NotificationBell";

export function Topbar({ title, onOpenMenu }: { title: string; onOpenMenu: () => void }) {
  const { currentUser, allUsers, loginAs, logout } = useAuth();
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) return null;

  return (
    <header className="flex h-14 items-center justify-between border-b border-ink-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-600 hover:bg-ink-100 lg:hidden"
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <h1 className="text-sm font-semibold text-ink-900 md:text-base">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setSwitching((v) => !v)}
            className="flex items-center gap-2 rounded-md border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
              {initials(currentUser.fullName)}
            </span>
            <span className="hidden sm:inline">{currentUser.fullName}</span>
            <span className="text-ink-400">▾</span>
          </button>
          {switching && (
            <div className="absolute right-0 z-40 mt-2 w-64 rounded-lg border border-ink-200 bg-white shadow-lg">
              <p className="border-b border-ink-100 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
                Cambiar usuario demo
              </p>
              <div className="max-h-72 overflow-y-auto py-1">
                {allUsers
                  .filter((u) => u.active)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        loginAs(u.id);
                        setSwitching(false);
                        navigate("/dashboard");
                      }}
                      className={`flex w-full flex-col items-start px-3 py-2 text-left text-xs hover:bg-ink-50 ${
                        u.id === currentUser.id ? "bg-brand-50" : ""
                      }`}
                    >
                      <span className="font-medium text-ink-900">{u.fullName}</span>
                      <span className="text-ink-500">{ROLES[u.role].label}</span>
                    </button>
                  ))}
              </div>
              <div className="border-t border-ink-100 px-3 py-2">
                <button
                  onClick={() => {
                    logout();
                    setSwitching(false);
                    navigate("/login");
                  }}
                  className="text-xs font-medium text-danger-600 hover:underline"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
