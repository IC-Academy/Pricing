import { useEffect, useState } from "react";
import { Drawer } from "../../components/Drawer";
import { Button } from "../../components/Button";
import { FieldWrap, SelectInput, TextInput } from "../../components/Field";
import type { PricingPermissions, RoleId, User } from "../../../types";
import { EMPTY_PRICING_PERMISSIONS } from "../../../types";
import { ROLES } from "../../../modules/auth/roles";
import { usersRepo } from "../../../data/db";
import { recordAuditEntry } from "../../../modules/audit-service";
import { newId, nowIso } from "../../../lib/ids";
import { useAuth } from "../../../modules/auth/AuthContext";
import { useToast } from "../../../state/ToastContext";

const PERMISSION_LABELS: { key: keyof PricingPermissions; label: string }[] = [
  { key: "editSalarios", label: "Editar salarios" },
  { key: "editImpuestos", label: "Editar impuestos" },
  { key: "editUniformes", label: "Editar uniformes" },
  { key: "editVehiculos", label: "Editar vehículos" },
  { key: "editEquipamiento", label: "Editar equipamiento" },
  { key: "resolverExcepciones", label: "Resolver excepciones" },
  { key: "consultarAuditoria", label: "Consultar auditoría" },
];

export function UserFormDrawer({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: User | null;
  onSaved: () => void;
}) {
  const { currentUser, refreshUsers } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleId>("VENTAS");
  const [active, setActive] = useState(true);
  const [permissions, setPermissions] = useState<PricingPermissions>(EMPTY_PRICING_PERMISSIONS);

  useEffect(() => {
    if (editing) {
      setFullName(editing.fullName);
      setCargo(editing.cargo ?? "");
      setEmail(editing.email);
      setRole(editing.role);
      setActive(editing.active);
      setPermissions(editing.permissions ?? EMPTY_PRICING_PERMISSIONS);
    } else {
      setFullName("");
      setCargo("");
      setEmail("");
      setRole("VENTAS");
      setActive(true);
      setPermissions(EMPTY_PRICING_PERMISSIONS);
    }
  }, [editing, open]);

  if (!currentUser) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;

    if (editing) {
      const before = editing;
      const after: User = {
        ...editing,
        fullName,
        cargo,
        email,
        role,
        active,
        permissions: role === "PRICING" ? permissions : undefined,
      };
      usersRepo.replace(editing.id, after);
      recordAuditEntry({
        entidad: "USUARIO",
        entidadId: editing.id,
        descripcion: `Se actualizó el usuario ${after.fullName}`,
        valorAnterior: `${before.role}${before.active ? "" : " (inactivo)"}`,
        valorNuevo: `${after.role}${after.active ? "" : " (inactivo)"}`,
        usuario: currentUser.fullName,
      });
      if (role === "PRICING") {
        recordAuditEntry({
          entidad: "PERMISO",
          entidadId: editing.id,
          descripcion: `Se actualizaron permisos de ${after.fullName}`,
          usuario: currentUser.fullName,
        });
      }
      showToast("Usuario actualizado.");
    } else {
      const user: User = {
        id: newId(),
        fullName,
        cargo,
        email,
        role,
        active,
        permissions: role === "PRICING" ? permissions : undefined,
        createdAt: nowIso(),
      };
      usersRepo.create(user);
      recordAuditEntry({
        entidad: "USUARIO",
        entidadId: user.id,
        descripcion: `Se creó el usuario ${user.fullName} con rol ${ROLES[user.role].label}`,
        usuario: currentUser.fullName,
      });
      showToast("Usuario creado.");
    }
    refreshUsers();
    onSaved();
    onClose();
  }

  return (
    <Drawer open={open} onClose={onClose} title={editing ? "Editar usuario" : "Nuevo usuario"}>
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <FieldWrap label="Nombre completo">
          <TextInput required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Cargo">
          <TextInput value={cargo} onChange={(e) => setCargo(e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Correo">
          <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Rol">
          <SelectInput value={role} onChange={(e) => setRole(e.target.value as RoleId)}>
            {Object.values(ROLES).map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </SelectInput>
        </FieldWrap>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Usuario activo
        </label>

        {role === "PRICING" && (
          <div className="rounded-md border border-ink-200 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Permisos Pricing</p>
            <div className="space-y-1.5">
              {PERMISSION_LABELS.map((p) => (
                <label key={p.key} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={permissions[p.key]}
                    onChange={(e) => setPermissions({ ...permissions, [p.key]: e.target.checked })}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </form>

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" form="user-form">
          {editing ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </Drawer>
  );
}
