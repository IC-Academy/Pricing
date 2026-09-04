import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { createQuotation } from "../../../modules/quotation-service";
import { CIUDADES_DEMO, ESTADO_POR_CIUDAD } from "../../../types";
import type { CiudadDemo, DatosGenerales, ParametrosComerciales, PerfilPuesto, PuestoCotizado } from "../../../types";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { FieldWrap, SelectInput, TextArea, TextInput } from "../../components/Field";
import { newId } from "../../../lib/ids";
import { defaultEquipo, defaultSalario, defaultUniforme, defaultVehiculo } from "./defaults";
import { useToast } from "../../../state/ToastContext";

const PERFILES: PerfilPuesto[] = ["Guardia Intramuros", "Guardia Armado", "Supervisor"];
const COBERTURAS: PuestoCotizado["cobertura"][] = ["24x7", "12x7", "Diurna", "Nocturna"];

function nuevoPuesto(ciudad: CiudadDemo): PuestoCotizado {
  const tipoPuesto: PerfilPuesto = "Guardia Intramuros";
  return {
    id: newId(),
    tipoPuesto,
    cantidadPosiciones: 1,
    cobertura: "24x7",
    horas: 12,
    dias: 30,
    salarioMensual: defaultSalario(tipoPuesto, ciudad),
    uniformeCosto: defaultUniforme(tipoPuesto),
    equipoCosto: defaultEquipo(),
    vehiculoOpcional: false,
    vehiculoCosto: defaultVehiculo(),
  };
}

const STEPS = ["Datos generales", "Servicio", "Parámetros comerciales"];

export function CalculadoraWizard() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [datosGenerales, setDatosGenerales] = useState<DatosGenerales>({
    cliente: "",
    nombreOportunidad: "",
    ciudad: "CDMX",
    estado: ESTADO_POR_CIUDAD.CDMX,
    fecha: new Date().toISOString().slice(0, 10),
    vendedorId: currentUser?.id ?? "",
    vendedorNombre: currentUser?.fullName ?? "",
  });

  const [puestos, setPuestos] = useState<PuestoCotizado[]>([nuevoPuesto("CDMX")]);

  const [parametros, setParametros] = useState<ParametrosComerciales>({
    grossMarginObjetivo: 0.25,
    vigenciaPropuestaDias: 30,
    observaciones: "",
    opcionales: "",
  });

  if (!currentUser) return null;

  function updatePuesto(id: string, patch: Partial<PuestoCotizado>) {
    setPuestos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addPuesto() {
    setPuestos((prev) => [...prev, nuevoPuesto(datosGenerales.ciudad)]);
  }

  function removePuesto(id: string) {
    setPuestos((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  }

  function canAdvance(): boolean {
    if (step === 0) return datosGenerales.cliente.trim().length > 0 && datosGenerales.nombreOportunidad.trim().length > 0;
    if (step === 1) return puestos.every((p) => p.cantidadPosiciones > 0 && p.salarioMensual > 0);
    return true;
  }

  function handleSaveDraft() {
    createQuotation({
      datosGenerales,
      puestos,
      parametrosComerciales: parametros,
      createdBy: currentUser!.id,
      asDraft: true,
    });
    showToast("Cotización guardada como borrador.", "info");
    navigate("/mis-cotizaciones");
  }

  function handleCalcular() {
    const quotation = createQuotation({
      datosGenerales,
      puestos,
      parametrosComerciales: parametros,
      createdBy: currentUser!.id,
    });
    if (quotation.status === "PENDIENTE_VALIDACION") {
      showToast("Cotización calculada. Se detectaron valores fuera de parámetro — se generó una excepción para Pricing.", "warning");
    } else {
      showToast("Cotización calculada correctamente.", "success");
    }
    navigate(`/cotizaciones/${quotation.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Nueva Cotización</h2>
        <p className="text-sm text-ink-500">Levanta el requerimiento del cliente y obtén una cotización preliminar al instante.</p>
      </div>

      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i === step ? "bg-brand-600 text-white" : i < step ? "bg-success-500 text-white" : "bg-ink-200 text-ink-500"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`hidden text-xs font-medium sm:block ${i === step ? "text-ink-900" : "text-ink-500"}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-ink-200" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldWrap label="Cliente">
              <TextInput
                value={datosGenerales.cliente}
                onChange={(e) => setDatosGenerales({ ...datosGenerales, cliente: e.target.value })}
                placeholder="Razón social del cliente"
              />
            </FieldWrap>
            <FieldWrap label="Nombre de oportunidad">
              <TextInput
                value={datosGenerales.nombreOportunidad}
                onChange={(e) => setDatosGenerales({ ...datosGenerales, nombreOportunidad: e.target.value })}
                placeholder="Ej. Resguardo planta CDMX"
              />
            </FieldWrap>
            <FieldWrap label="Ciudad">
              <SelectInput
                value={datosGenerales.ciudad}
                onChange={(e) => {
                  const ciudad = e.target.value as CiudadDemo;
                  setDatosGenerales({ ...datosGenerales, ciudad, estado: ESTADO_POR_CIUDAD[ciudad] });
                }}
              >
                {CIUDADES_DEMO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
            </FieldWrap>
            <FieldWrap label="Estado">
              <TextInput value={datosGenerales.estado} disabled />
            </FieldWrap>
            <FieldWrap label="Fecha">
              <TextInput
                type="date"
                value={datosGenerales.fecha}
                onChange={(e) => setDatosGenerales({ ...datosGenerales, fecha: e.target.value })}
              />
            </FieldWrap>
            <FieldWrap label="Vendedor">
              <TextInput value={datosGenerales.vendedorNombre} disabled />
            </FieldWrap>
          </div>
        </Card>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {puestos.map((puesto, idx) => (
            <Card key={puesto.id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">Puesto {idx + 1}</p>
                {puestos.length > 1 && (
                  <button onClick={() => removePuesto(puesto.id)} className="text-xs font-medium text-danger-600 hover:underline">
                    Quitar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FieldWrap label="Tipo de puesto">
                  <SelectInput
                    value={puesto.tipoPuesto}
                    onChange={(e) => {
                      const tipoPuesto = e.target.value as PerfilPuesto;
                      updatePuesto(puesto.id, {
                        tipoPuesto,
                        salarioMensual: defaultSalario(tipoPuesto, datosGenerales.ciudad),
                        uniformeCosto: defaultUniforme(tipoPuesto),
                      });
                    }}
                  >
                    {PERFILES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </SelectInput>
                </FieldWrap>
                <FieldWrap label="Cantidad de posiciones">
                  <TextInput
                    type="number"
                    min={1}
                    value={puesto.cantidadPosiciones}
                    onChange={(e) => updatePuesto(puesto.id, { cantidadPosiciones: Number(e.target.value) })}
                  />
                </FieldWrap>
                <FieldWrap label="Cobertura">
                  <SelectInput value={puesto.cobertura} onChange={(e) => updatePuesto(puesto.id, { cobertura: e.target.value as PuestoCotizado["cobertura"] })}>
                    {COBERTURAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </SelectInput>
                </FieldWrap>
                <FieldWrap label="Horas por turno">
                  <TextInput type="number" value={puesto.horas} onChange={(e) => updatePuesto(puesto.id, { horas: Number(e.target.value) })} />
                </FieldWrap>
                <FieldWrap label="Días al mes">
                  <TextInput type="number" value={puesto.dias} onChange={(e) => updatePuesto(puesto.id, { dias: Number(e.target.value) })} />
                </FieldWrap>
                <FieldWrap label="Salario mensual (MXN)" hint="Editable — se valida contra el catálogo de Salarios">
                  <TextInput
                    type="number"
                    value={puesto.salarioMensual}
                    onChange={(e) => updatePuesto(puesto.id, { salarioMensual: Number(e.target.value) })}
                  />
                </FieldWrap>
                <FieldWrap label="Costo uniforme (MXN/mes)">
                  <TextInput
                    type="number"
                    value={puesto.uniformeCosto}
                    onChange={(e) => updatePuesto(puesto.id, { uniformeCosto: Number(e.target.value) })}
                  />
                </FieldWrap>
                <FieldWrap label="Costo equipo (MXN/mes)">
                  <TextInput
                    type="number"
                    value={puesto.equipoCosto}
                    onChange={(e) => updatePuesto(puesto.id, { equipoCosto: Number(e.target.value) })}
                  />
                </FieldWrap>
                <div>
                  <label className="mb-1 flex items-center gap-2 text-xs font-medium text-ink-700">
                    <input
                      type="checkbox"
                      checked={puesto.vehiculoOpcional}
                      onChange={(e) => updatePuesto(puesto.id, { vehiculoOpcional: e.target.checked })}
                    />
                    Incluir vehículo opcional
                  </label>
                  {puesto.vehiculoOpcional && (
                    <TextInput
                      type="number"
                      value={puesto.vehiculoCosto}
                      onChange={(e) => updatePuesto(puesto.id, { vehiculoCosto: Number(e.target.value) })}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
          <Button variant="secondary" onClick={addPuesto}>
            + Agregar puesto
          </Button>
        </div>
      )}

      {step === 2 && (
        <Card className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldWrap label="Gross margin objetivo" hint="Expresado como porcentaje, ej. 25">
              <TextInput
                type="number"
                step="0.1"
                value={Math.round(parametros.grossMarginObjetivo * 1000) / 10}
                onChange={(e) => setParametros({ ...parametros, grossMarginObjetivo: Number(e.target.value) / 100 })}
              />
            </FieldWrap>
            <FieldWrap label="Vigencia de la propuesta (días)">
              <TextInput
                type="number"
                value={parametros.vigenciaPropuestaDias}
                onChange={(e) => setParametros({ ...parametros, vigenciaPropuestaDias: Number(e.target.value) })}
              />
            </FieldWrap>
          </div>
          <div className="mt-4">
            <FieldWrap label="Observaciones">
              <TextArea rows={3} value={parametros.observaciones} onChange={(e) => setParametros({ ...parametros, observaciones: e.target.value })} />
            </FieldWrap>
          </div>
          <div className="mt-4">
            <FieldWrap label="Opcionales">
              <TextArea rows={2} value={parametros.opcionales} onChange={(e) => setParametros({ ...parametros, opcionales: e.target.value })} />
            </FieldWrap>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Atrás
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSaveDraft}>
            Guardar borrador
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={!canAdvance()}>
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleCalcular}>Calcular cotización</Button>
          )}
        </div>
      </div>
    </div>
  );
}
