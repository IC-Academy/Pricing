import { describe, expect, it } from "vitest";
import { calcularCostoLaboralMensual, calcularCotizacion, calcularPuesto, CARGA_SOCIAL_PCT, OVERHEAD_PCT } from "./index";
import type { PuestoCotizado } from "../../types";

function puesto(overrides: Partial<PuestoCotizado> = {}): PuestoCotizado {
  return {
    id: "p1",
    tipoPuesto: "Guardia Intramuros",
    cantidadPosiciones: 1,
    cobertura: "24x7",
    horas: 12,
    dias: 30,
    salarioMensual: 10000,
    uniformeCosto: 0,
    equipoCosto: 0,
    vehiculoOpcional: false,
    vehiculoCosto: 0,
    ...overrides,
  };
}

describe("pricing-engine", () => {
  it("calculates carga social on top of the base salary", () => {
    const costoLaboral = calcularCostoLaboralMensual(10000);
    expect(costoLaboral).toBeCloseTo(10000 * (1 + CARGA_SOCIAL_PCT));
  });

  it("adds uniforme, equipo and overhead into the monthly cost of a single position", () => {
    const p = puesto({ salarioMensual: 10000, uniformeCosto: 300, equipoCosto: 200 });
    const result = calcularPuesto(p, 0.25);

    const costoLaboral = 10000 * (1 + CARGA_SOCIAL_PCT);
    const subtotal = costoLaboral + 300 + 200;
    const overhead = subtotal * OVERHEAD_PCT;
    const costoEsperado = subtotal + overhead;

    expect(result.costoMensualTotal).toBeCloseTo(costoEsperado, 2);
  });

  it("ignores vehiculoCosto when vehiculoOpcional is false", () => {
    const withVehicle = calcularPuesto(puesto({ vehiculoOpcional: false, vehiculoCosto: 9999 }), 0.25);
    const withoutVehicle = calcularPuesto(puesto({ vehiculoOpcional: false, vehiculoCosto: 0 }), 0.25);
    expect(withVehicle.costoMensualTotal).toBeCloseTo(withoutVehicle.costoMensualTotal, 2);
  });

  it("includes vehiculoCosto when vehiculoOpcional is true", () => {
    const withVehicle = calcularPuesto(puesto({ vehiculoOpcional: true, vehiculoCosto: 5000 }), 0.25);
    const withoutVehicle = calcularPuesto(puesto({ vehiculoOpcional: false, vehiculoCosto: 5000 }), 0.25);
    expect(withVehicle.costoMensualTotal).toBeGreaterThan(withoutVehicle.costoMensualTotal);
  });

  it("computes price as cost / (1 - margen)", () => {
    const p = puesto({ salarioMensual: 10000 });
    const margen = 0.3;
    const result = calcularPuesto(p, margen);
    expect(result.precioRecomendadoUnitario).toBeCloseTo(result.costoMensualTotal / (1 - margen), 2);
  });

  it("multiplies unit price/cost by cantidadPosiciones for the position total", () => {
    const result = calcularPuesto(puesto({ cantidadPosiciones: 5, salarioMensual: 10000 }), 0.25);
    expect(result.precioTotalPuesto).toBeCloseTo(result.precioRecomendadoUnitario * 5, 2);
    expect(result.costoMensualTotal).toBeCloseTo((result.costoMensualTotal / 5) * 5, 2);
  });

  it("clamps an out-of-range margin instead of dividing by zero or going negative", () => {
    const result = calcularPuesto(puesto({ salarioMensual: 10000 }), 1.5); // 150% margin, invalid
    expect(Number.isFinite(result.precioRecomendadoUnitario)).toBe(true);
    expect(result.precioRecomendadoUnitario).toBeGreaterThan(0);
  });

  it("aggregates multiple puestos into totals", () => {
    const puestos = [puesto({ id: "a", cantidadPosiciones: 2, salarioMensual: 10000 }), puesto({ id: "b", cantidadPosiciones: 1, salarioMensual: 15000 })];
    const resultado = calcularCotizacion(puestos, { grossMarginObjetivo: 0.25, vigenciaPropuestaDias: 30 });
    const sumaCosto = resultado.puestos.reduce((acc, p) => acc + p.costoMensualTotal, 0);
    const sumaPrecio = resultado.puestos.reduce((acc, p) => acc + p.precioTotalPuesto, 0);
    expect(resultado.costoMensualTotal).toBeCloseTo(sumaCosto, 2);
    expect(resultado.precioMensualTotal).toBeCloseTo(sumaPrecio, 2);
  });
});
