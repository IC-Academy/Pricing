import { describe, expect, it } from "vitest";
import { calculateFinancialScenario, DEFAULT_FINANCIAL_MODEL_PARAMS } from "./index";

describe("financial-model", () => {
  it("builds monthly and annual cost summary from Gross Comp and direct costs", () => {
    const result = calculateFinancialScenario({
      ciudad:"CDMX", salarioMensual:10000, posiciones:2,
      uniformeMensual:300, equipoMensual:200, vehiculoMensual:0,
      examenesMensual:100, otrosDirectosMensual:0,
    }, DEFAULT_FINANCIAL_MODEL_PARAMS);
    expect(result.laboral.totalServicio).toBeGreaterThan(20000);
    expect(result.costos.costoTotalMensual).toBeGreaterThan(result.laboral.totalServicio);
    expect(result.costos.costoTotalAnual).toBeCloseTo(result.costos.costoTotalMensual*12,2);
    expect(result.precio.mensualMxn).toBeGreaterThan(result.costos.costoTotalMensual);
  });

  it("applies Pricing-controlled indirect, G&A and financing percentages", () => {
    const base = calculateFinancialScenario({
      ciudad:"Querétaro", salarioMensual:12000, posiciones:1,
      uniformeMensual:0, equipoMensual:0, vehiculoMensual:0, examenesMensual:0, otrosDirectosMensual:0,
    }, DEFAULT_FINANCIAL_MODEL_PARAMS);
    const adjusted = calculateFinancialScenario({
      ciudad:"Querétaro", salarioMensual:12000, posiciones:1,
      uniformeMensual:0, equipoMensual:0, vehiculoMensual:0, examenesMensual:0, otrosDirectosMensual:0,
    }, { ...DEFAULT_FINANCIAL_MODEL_PARAMS, indirectPct:0.03, gaPct:0.02, financingPct:0.01 });
    expect(adjusted.costos.costoTotalMensual).toBeGreaterThan(base.costos.costoTotalMensual);
  });

  it("flags structure cost when projected service requires extra staff but cost is not parameterized", () => {
    const result = calculateFinancialScenario({
      ciudad:"CDMX", salarioMensual:12000, posiciones:500,
      uniformeMensual:0, equipoMensual:0, vehiculoMensual:0, examenesMensual:0, otrosDirectosMensual:0,
    }, DEFAULT_FINANCIAL_MODEL_PARAMS);
    expect(result.estructura.supervisoresAdicionales).toBeGreaterThan(0);
    expect(result.estructura.requiereCostoPendiente).toBe(true);
  });
});
