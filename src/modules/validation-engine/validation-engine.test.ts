import { beforeEach, describe, expect, it } from "vitest";
import { validarPuestos, crearExcepciones, acceptException, convertExceptionToParameter } from "./index";
import { catalogItemsRepo, exceptionsRepo } from "../../data/db";
import { clearAllPm365Storage } from "../../lib/storage";
import type { CatalogItem, DatosGenerales, PuestoCotizado } from "../../types";

function salaryCatalogItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: "cat-1",
    catalogType: "SALARIOS",
    nombre: "Guardia Intramuros",
    categoria: "Sueldos base",
    ubicacion: "Querétaro",
    valor: 11250,
    unidad: "MXN/mes",
    valorMin: 10500,
    valorMax: 12000,
    fechaInicio: new Date().toISOString(),
    fechaVencimiento: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    responsable: "Pricing",
    ultimaActualizacion: new Date().toISOString(),
    usuarioModifico: "Test",
    diasAnticipacionAlerta: 30,
    activo: true,
    ...overrides,
  };
}

function datosGenerales(overrides: Partial<DatosGenerales> = {}): DatosGenerales {
  return {
    cliente: "Cliente Demo",
    nombreOportunidad: "Oportunidad Demo",
    ciudad: "Querétaro" as DatosGenerales["ciudad"],
    estado: "Querétaro",
    fecha: new Date().toISOString(),
    vendedorId: "u-ventas-1",
    vendedorNombre: "Ana Ruiz",
    ...overrides,
  };
}

function puesto(overrides: Partial<PuestoCotizado> = {}): PuestoCotizado {
  return {
    id: "p1",
    tipoPuesto: "Guardia Intramuros",
    cantidadPosiciones: 1,
    cobertura: "24x7",
    horas: 12,
    dias: 30,
    salarioMensual: 11000,
    uniformeCosto: 300,
    equipoCosto: 200,
    vehiculoOpcional: false,
    vehiculoCosto: 0,
    ...overrides,
  };
}

describe("validation-engine", () => {
  beforeEach(() => {
    clearAllPm365Storage();
    catalogItemsRepo.create(salaryCatalogItem());
  });

  it("does not flag a salary within the authorized range", () => {
    const hallazgos = validarPuestos([puesto({ salarioMensual: 11500 })], datosGenerales());
    expect(hallazgos).toHaveLength(0);
  });

  it("flags a salary above the authorized max and reports the difference", () => {
    const hallazgos = validarPuestos([puesto({ salarioMensual: 13000 })], datosGenerales());
    expect(hallazgos).toHaveLength(1);
    expect(hallazgos[0].valorEsperadoMin).toBe(10500);
    expect(hallazgos[0].valorEsperadoMax).toBe(12000);
    expect(hallazgos[0].diferenciaAbsoluta).toBeCloseTo(13000 - (10500 + 12000) / 2, 2);
  });

  it("flags a salary below the authorized min", () => {
    const hallazgos = validarPuestos([puesto({ salarioMensual: 9000 })], datosGenerales());
    expect(hallazgos).toHaveLength(1);
    expect(hallazgos[0].diferenciaAbsoluta).toBeLessThan(0);
  });

  it("never blocks the quote — it only returns findings for the caller to act on", () => {
    // validarPuestos has no notion of "blocking"; it simply returns findings.
    const hallazgos = validarPuestos([puesto({ salarioMensual: 999999 })], datosGenerales());
    expect(hallazgos).toHaveLength(1); // caller decides what to do; no exception thrown
  });

  it("persists one ValidationException per finding, in PENDIENTE state", () => {
    const hallazgos = validarPuestos([puesto({ salarioMensual: 13000 })], datosGenerales());
    const created = crearExcepciones(hallazgos, "q1", "PM-2026-00001", "Cliente Demo", "Ana Ruiz");
    expect(created).toHaveLength(1);
    expect(created[0].status).toBe("PENDIENTE");
    expect(exceptionsRepo.getAll()).toHaveLength(1);
  });

  it("acceptException requires the caller to persist a comment and marks it resolved", () => {
    const hallazgos = validarPuestos([puesto({ salarioMensual: 13000 })], datosGenerales());
    const [created] = crearExcepciones(hallazgos, "q1", "PM-2026-00001", "Cliente Demo", "Ana Ruiz");

    const resolved = acceptException(created.id, "Autorizado como caso especial", "Laura Sánchez");
    expect(resolved?.status).toBe("ACEPTADA");
    expect(resolved?.comentarioResolucion).toBe("Autorizado como caso especial");
  });

  it("convertExceptionToParameter widens the catalog range to include the captured value", () => {
    const hallazgos = validarPuestos([puesto({ salarioMensual: 13000 })], datosGenerales());
    const [created] = crearExcepciones(hallazgos, "q1", "PM-2026-00001", "Cliente Demo", "Ana Ruiz");

    convertExceptionToParameter(created.id, "Se vuelve el nuevo tope autorizado", "Laura Sánchez");

    const catalogItem = catalogItemsRepo.getById("cat-1");
    expect(catalogItem?.valorMax).toBe(13000);

    // Re-validating the same salary should no longer raise a finding.
    const hallazgosDespues = validarPuestos([puesto({ salarioMensual: 13000 })], datosGenerales());
    expect(hallazgosDespues).toHaveLength(0);
  });
});
