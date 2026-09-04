import { useEffect, useState } from "react";
import { Drawer } from "../../components/Drawer";
import { Button } from "../../components/Button";
import { FieldWrap, SelectInput, TextArea, TextInput } from "../../components/Field";
import type { CatalogItem, CatalogType } from "../../../types";
import { createCatalogItem, updateCatalogItem } from "../../../modules/catalog-service";
import { useAuth } from "../../../modules/auth/AuthContext";
import { useToast } from "../../../state/ToastContext";

const CATEGORIES: Record<CatalogType, string[]> = {
  SALARIOS: ["Sueldos base", "Bonos", "Compensación variable"],
  IMPUESTOS: ["Impuestos estatales", "Seguridad social", "Impuestos federales"],
  UNIFORMES: ["Uniformes", "Calzado", "Accesorios"],
  VEHICULOS: ["Flotilla", "Arrendamiento", "Mantenimiento"],
  EQUIPAMIENTO: ["Equipo", "Equipo de protección", "Tecnología"],
};

export function CatalogFormDrawer({
  open,
  onClose,
  catalogType,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  catalogType: CatalogType;
  editing: CatalogItem | null;
  onSaved: () => void;
}) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const blank = {
    nombre: "",
    categoria: CATEGORIES[catalogType][0],
    ubicacion: "",
    valor: 0,
    unidad: catalogType === "SALARIOS" ? "MXN/mes" : catalogType === "IMPUESTOS" ? "%" : "MXN/mes (amortizado)",
    valorMin: undefined as number | undefined,
    valorMax: undefined as number | undefined,
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaVencimiento: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    responsable: "Pricing",
    diasAnticipacionAlerta: 30,
    comentarios: "",
  };

  const [form, setForm] = useState(blank);
  const [comentarioCambio, setComentarioCambio] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        nombre: editing.nombre,
        categoria: editing.categoria,
        ubicacion: editing.ubicacion,
        valor: editing.valor,
        unidad: editing.unidad,
        valorMin: editing.valorMin,
        valorMax: editing.valorMax,
        fechaInicio: editing.fechaInicio.slice(0, 10),
        fechaVencimiento: editing.fechaVencimiento.slice(0, 10),
        responsable: editing.responsable,
        diasAnticipacionAlerta: editing.diasAnticipacionAlerta,
        comentarios: editing.comentarios ?? "",
      });
    } else {
      setForm(blank);
    }
    setComentarioCambio("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open, catalogType]);

  if (!currentUser) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;

    if (editing) {
      updateCatalogItem(
        editing.id,
        {
          nombre: form.nombre,
          categoria: form.categoria,
          ubicacion: form.ubicacion,
          valor: Number(form.valor),
          unidad: form.unidad,
          valorMin: form.valorMin !== undefined ? Number(form.valorMin) : undefined,
          valorMax: form.valorMax !== undefined ? Number(form.valorMax) : undefined,
          fechaInicio: new Date(form.fechaInicio).toISOString(),
          fechaVencimiento: new Date(form.fechaVencimiento).toISOString(),
          responsable: form.responsable,
          diasAnticipacionAlerta: Number(form.diasAnticipacionAlerta),
          comentarios: form.comentarios,
        },
        currentUser.fullName,
        comentarioCambio || undefined
      );
      showToast("Catálogo actualizado correctamente.");
    } else {
      createCatalogItem(
        {
          catalogType,
          nombre: form.nombre,
          categoria: form.categoria,
          ubicacion: form.ubicacion,
          valor: Number(form.valor),
          unidad: form.unidad,
          valorMin: form.valorMin !== undefined ? Number(form.valorMin) : undefined,
          valorMax: form.valorMax !== undefined ? Number(form.valorMax) : undefined,
          fechaInicio: new Date(form.fechaInicio).toISOString(),
          fechaVencimiento: new Date(form.fechaVencimiento).toISOString(),
          responsable: form.responsable,
          diasAnticipacionAlerta: Number(form.diasAnticipacionAlerta),
          comentarios: form.comentarios,
          usuarioModifico: currentUser.fullName,
        },
        currentUser.fullName
      );
      showToast("Catálogo creado correctamente.");
    }
    onSaved();
    onClose();
  }

  const needsRange = catalogType === "SALARIOS";

  return (
    <Drawer open={open} onClose={onClose} title={editing ? "Editar registro" : "Nuevo registro de catálogo"}>
      <form id="catalog-form" onSubmit={handleSubmit} className="space-y-4">
        <FieldWrap label="Nombre">
          <TextInput required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </FieldWrap>

        <FieldWrap label="Categoría">
          <SelectInput value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {CATEGORIES[catalogType].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
        </FieldWrap>

        <FieldWrap label="Ubicación" hint="Ciudad, estado o 'Nacional'">
          <TextInput required value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
        </FieldWrap>

        <div className="grid grid-cols-2 gap-3">
          <FieldWrap label="Valor">
            <TextInput
              type="number"
              step="0.01"
              required
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
            />
          </FieldWrap>
          <FieldWrap label="Unidad">
            <TextInput required value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} />
          </FieldWrap>
        </div>

        {needsRange && (
          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Valor mínimo recomendado">
              <TextInput
                type="number"
                value={form.valorMin ?? ""}
                onChange={(e) => setForm({ ...form, valorMin: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </FieldWrap>
            <FieldWrap label="Valor máximo recomendado">
              <TextInput
                type="number"
                value={form.valorMax ?? ""}
                onChange={(e) => setForm({ ...form, valorMax: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </FieldWrap>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FieldWrap label="Fecha de inicio">
            <TextInput
              type="date"
              required
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            />
          </FieldWrap>
          <FieldWrap label="Fecha de vencimiento">
            <TextInput
              type="date"
              required
              value={form.fechaVencimiento}
              onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
            />
          </FieldWrap>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldWrap label="Responsable">
            <TextInput required value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
          </FieldWrap>
          <FieldWrap label="Días de anticipación para alerta">
            <TextInput
              type="number"
              required
              value={form.diasAnticipacionAlerta}
              onChange={(e) => setForm({ ...form, diasAnticipacionAlerta: Number(e.target.value) })}
            />
          </FieldWrap>
        </div>

        <FieldWrap label="Comentarios">
          <TextArea rows={2} value={form.comentarios} onChange={(e) => setForm({ ...form, comentarios: e.target.value })} />
        </FieldWrap>

        {editing && (
          <FieldWrap label="Comentario del cambio (opcional)" hint="Se guarda en el historial de este registro.">
            <TextInput value={comentarioCambio} onChange={(e) => setComentarioCambio(e.target.value)} />
          </FieldWrap>
        )}
      </form>

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" form="catalog-form">
          {editing ? "Guardar cambios" : "Crear registro"}
        </Button>
      </div>
    </Drawer>
  );
}
