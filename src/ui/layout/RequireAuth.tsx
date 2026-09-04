import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { canAccessSection, type AppSection } from "../../modules/auth/roles";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Blocks a route unless the current user's role can access the given section.
 * This is the enforcement point behind rules like "Ventas no puede acceder a Configuración". */
export function RequireSection({ section, children }: { section: AppSection; children: ReactNode }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!canAccessSection(currentUser.role, section)) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-lg border border-ink-200 bg-white p-8 text-center shadow-sm">
        <p className="text-3xl">🔒</p>
        <h2 className="mt-3 text-base font-semibold text-ink-900">Acceso no autorizado</h2>
        <p className="mt-1 text-sm text-ink-500">
          Tu rol ({currentUser.role}) no tiene permiso para ver esta sección.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
