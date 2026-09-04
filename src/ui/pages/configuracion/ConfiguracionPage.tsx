import { useState } from "react";
import { useAuth } from "../../../modules/auth/AuthContext";
import { canManageGlobalConfig, canConfigureVigenciasYAlertas, isAdminLike, ROLES } from "../../../modules/auth/roles";
import { globalConfigStore, resetDemoData } from "../../../data/db";
import { recordAuditEntry } from "../../../modules/audit-service";
import { Card, CardHeader } from "../../components/Card";
import { Button } from "../../components/Button";
import { FieldWrap, TextInput } from "../../components/Field";
import { Modal } from "../../components/Drawer";
import { formatDateTimeEs } from "../../../lib/ids";
import { useToast } from "../../../state/ToastContext";

export function ConfiguracionPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [config, setConfig] = useState(globalConfigStore.get());
  const [diasDefault, setDiasDefault] = useState(config.defaultDiasAnticipacionAlerta);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!currentUser) return null;

  function handleSaveConfig() {
    if (!currentUser) return;
    const before = config.defaultDiasAnticipacionAlerta;
    const updated = { ...config, defaultDiasAnticipacionAlerta: diasDefault };
    globalConfigStore.set(updated);
    setConfig(updated);
    recordAuditEntry({
      entidad: "PARAMETRO",
      entidadId: "config-global",
      descripcion: "Se ajustó el días de anticipación de alerta por defecto",
      valorAnterior: String(before),
      valorNuevo: String(diasDefault),
      usuario: currentUser.fullName,
    });
    showToast("Configuración guardada.");
  }

  function handleReset() {
    resetDemoData();
    setConfirmReset(false);
    showToast("Datos demo restablecidos. Recargando…", "info");
    setTimeout(() => window.location.assign("/login"), 600);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Configuración</h2>
        <p className="text-sm text-ink-500">Parámetros globales del Price Model y utilidades de la demo.</p>
      </div>

      <Card>
        <CardHeader title="Vigencias y alertas" subtitle="Configuración por defecto para nuevos registros de catálogo." />
        <div className="space-y-4 px-5 py-4">
          <div className="max-w-xs">
            <FieldWrap label="Días de anticipación por defecto">
              <TextInput
                type="number"
                value={diasDefault}
                disabled={!canConfigureVigenciasYAlertas(currentUser.role)}
                onChange={(e) => setDiasDefault(Number(e.target.value))}
              />
            </FieldWrap>
          </div>
          {canConfigureVigenciasYAlertas(currentUser.role) ? (
            <Button size="sm" onClick={handleSaveConfig}>
              Guardar
            </Button>
          ) : (
            <p className="text-xs text-ink-400">Tu rol no puede modificar este parámetro.</p>
          )}
          <p className="text-xs text-ink-500">
            Última actualización general del modelo: {formatDateTimeEs(config.ultimaActualizacionModelo)}
          </p>
        </div>
      </Card>

      {canManageGlobalConfig(currentUser.role) && (
        <Card>
          <CardHeader title="Configuración global" subtitle="Solo visible para Superadmin Técnico." />
          <div className="px-5 py-4 text-sm text-ink-600">
            <p>Rol actual: {ROLES[currentUser.role].label}</p>
            <p className="mt-1 text-xs text-ink-400">
              Espacio reservado para parámetros técnicos avanzados (integraciones, entornos, feature flags) cuando el
              sistema se conecte a Microsoft 365.
            </p>
          </div>
        </Card>
      )}

      {isAdminLike(currentUser.role) && (
        <Card>
          <CardHeader title="Datos demo" subtitle="Restablece toda la información a su estado inicial." />
          <div className="flex items-center justify-between px-5 py-4">
            <p className="max-w-lg text-sm text-ink-600">
              Esta acción borra usuarios, catálogos, cotizaciones, excepciones y auditoría capturados durante la demo, y
              vuelve a cargar el set de datos de demostración original.
            </p>
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Restablecer datos demo
            </Button>
          </div>
        </Card>
      )}

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Restablecer datos demo"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Sí, restablecer
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-700">
          Se perderán todos los cambios capturados durante esta sesión de demo y se cerrará tu sesión. ¿Deseas continuar?
        </p>
      </Modal>
    </div>
  );
}
