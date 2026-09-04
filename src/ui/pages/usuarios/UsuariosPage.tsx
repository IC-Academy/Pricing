import { useState } from "react";
import { useAuth } from "../../../modules/auth/AuthContext";
import { ROLES } from "../../../modules/auth/roles";
import { Card, CardHeader } from "../../components/Card";
import { Button } from "../../components/Button";
import { formatDateEs } from "../../../lib/ids";
import type { User } from "../../../types";
import { UserFormDrawer } from "./UserFormDrawer";

export function UsuariosPage() {
  const { allUsers, refreshUsers } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Usuarios y permisos</h2>
          <p className="text-sm text-ink-500">Administra los usuarios de la plataforma y los permisos de Pricing.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDrawerOpen(true);
          }}
        >
          + Nuevo usuario
        </Button>
      </div>

      <Card>
        <CardHeader title={`Usuarios (${allUsers.length})`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-2.5 font-medium">Nombre</th>
                <th className="px-5 py-2.5 font-medium">Cargo</th>
                <th className="px-5 py-2.5 font-medium">Correo</th>
                <th className="px-5 py-2.5 font-medium">Rol</th>
                <th className="px-5 py-2.5 font-medium">Alta</th>
                <th className="px-5 py-2.5 font-medium">Estado</th>
                <th className="px-5 py-2.5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {allUsers.map((u) => (
                <tr key={u.id} className={u.active ? "" : "opacity-50"}>
                  <td className="px-5 py-2.5 font-medium text-ink-900">{u.fullName}</td>
                  <td className="px-5 py-2.5 text-ink-600">{u.cargo ?? "—"}</td>
                  <td className="px-5 py-2.5 text-ink-600">{u.email}</td>
                  <td className="px-5 py-2.5 text-ink-600">{ROLES[u.role].label}</td>
                  <td className="px-5 py-2.5 text-ink-600">{formatDateEs(u.createdAt)}</td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.active ? "bg-success-50 text-success-600" : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditing(u);
                        setDrawerOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <UserFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} editing={editing} onSaved={refreshUsers} />
    </div>
  );
}
