import { describe, expect, it } from "vitest";
import { DEFAULT_FINANCIAL_MODEL_PARAMS } from "./index";
import { evaluateAllParity, PARITY_CASES } from "./parity";

describe("financial model parity harness", () => {
  it("keeps at least one Excel control case", () => {
    expect(PARITY_CASES.length).toBeGreaterThan(0);
    expect(PARITY_CASES[0].precioExcelMensual).toBe(26097);
  });

  it("returns a measurable difference instead of hiding model drift", () => {
    const results = evaluateAllParity(DEFAULT_FINANCIAL_MODEL_PARAMS);
    expect(results).toHaveLength(PARITY_CASES.length);
    expect(Number.isFinite(results[0].diferencia)).toBe(true);
    expect(typeof results[0].pass).toBe("boolean");
  });
});
