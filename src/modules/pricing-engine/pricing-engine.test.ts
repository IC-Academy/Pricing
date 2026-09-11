import { beforeEach, describe, expect, it } from "vitest";
import { calcularCostoLaboralMensual, calcularCotizacion, calcularPuesto, costoMensualExamenes, CARGA_SOCIAL_PCT, OVERHEAD_PCT } from "./index";
import type { PuestoCotizado } from "../../types";

function puesto(overrides: Partial<PuestoCotizado> = {}): PuestoCotizado {
  return { id:"p1",tipoPuesto:"Guardia Intramuros",cantidadPosiciones:1,cobertura:"12x5",horas:12,dias:5,salarioMensual:10000,uniformeCosto:0,equipoCosto:0,vehiculoOpcional:false,vehiculoCosto:0,...overrides };
}

describe("pricing-engine", () => {
  beforeEach(()=>localStorage.clear());

  it("calculates carga social on top of the base salary", () => {
    expect(calcularCostoLaboralMensual(10000)).toBeCloseTo(10000*(1+CARGA_SOCIAL_PCT));
  });

  it("adds mandatory IC exams, uniforme, equipo and overhead into a 12x5 position", () => {
    const p=puesto({salarioMensual:10000,uniformeCosto:300,equipoCosto:200});
    const result=calcularPuesto(p,0.25);
    const costoLaboral=10000*(1+CARGA_SOCIAL_PCT);
    const examenesObligatoriosMensual=costoMensualExamenes(p);
    const subtotal=costoLaboral+300+200+examenesObligatoriosMensual;
    const costoEsperado=subtotal+(subtotal*OVERHEAD_PCT);
    expect(result.hcRequerido).toBe(1);
    expect(examenesObligatoriosMensual).toBeCloseTo(35.75,2);
    expect(result.costoMensualTotal).toBeCloseTo(costoEsperado,2);
  });

  it("prices 12x7 with two required HC for one physical position", () => {
    const base=calcularPuesto(puesto({cobertura:"12x7",horas:12,dias:7}),0.25);
    expect(base.horasSemana).toBe(84);
    expect(base.hcRequerido).toBe(2);
    expect(base.costoMensualTotal).toBeGreaterThan(calcularPuesto(puesto(),0.25).costoMensualTotal);
  });

  it("ignores vehiculoCosto when vehiculoOpcional is false", () => {
    const withVehicle=calcularPuesto(puesto({vehiculoOpcional:false,vehiculoCosto:9999}),0.25);
    const withoutVehicle=calcularPuesto(puesto({vehiculoOpcional:false,vehiculoCosto:0}),0.25);
    expect(withVehicle.costoMensualTotal).toBeCloseTo(withoutVehicle.costoMensualTotal,2);
  });

  it("includes vehiculoCosto when vehiculoOpcional is true", () => {
    const withVehicle=calcularPuesto(puesto({vehiculoOpcional:true,vehiculoCosto:5000}),0.25);
    const withoutVehicle=calcularPuesto(puesto({vehiculoOpcional:false,vehiculoCosto:5000}),0.25);
    expect(withVehicle.costoMensualTotal).toBeGreaterThan(withoutVehicle.costoMensualTotal);
  });

  it("computes price as cost / (1 - margen)", () => {
    const margen=0.3; const result=calcularPuesto(puesto({salarioMensual:10000}),margen);
    expect(result.precioTotalPuesto).toBeCloseTo(result.costoMensualTotal/(1-margen),2);
  });

  it("keeps unit price consistent for multiple 12x5 positions", () => {
    const result=calcularPuesto(puesto({cantidadPosiciones:5,salarioMensual:10000}),0.25);
    expect(result.hcRequerido).toBe(5);
    expect(result.precioTotalPuesto).toBeCloseTo(result.precioRecomendadoUnitario*5,2);
  });

  it("does not multiply group catalog totals again by position count", () => {
    const sinBienes=calcularPuesto(puesto({cantidadPosiciones:5}),0.25);
    const conBienes=calcularPuesto(puesto({cantidadPosiciones:5,equipoCosto:1260,uniformeCosto:500}),0.25);
    // La diferencia antes de overhead debe ser exactamente el total capturado del grupo: 1,760.
    // Con overhead 8%, el incremento esperado es 1,900.80, no 5 veces ese importe.
    expect(conBienes.costoMensualTotal-sinBienes.costoMensualTotal).toBeCloseTo(1760*(1+OVERHEAD_PCT),2);
  });

  it("clamps an out-of-range margin instead of dividing by zero or going negative", () => {
    const result=calcularPuesto(puesto({salarioMensual:10000}),1.5);
    expect(Number.isFinite(result.precioRecomendadoUnitario)).toBe(true);
    expect(result.precioRecomendadoUnitario).toBeGreaterThan(0);
  });

  it("aggregates multiple puestos into totals", () => {
    const puestos=[puesto({id:"a",cantidadPosiciones:2,salarioMensual:10000}),puesto({id:"b",cantidadPosiciones:1,salarioMensual:15000})];
    const resultado=calcularCotizacion(puestos,{grossMarginObjetivo:0.25,vigenciaPropuestaDias:30});
    const sumaCosto=resultado.puestos.reduce((acc,p)=>acc+p.costoMensualTotal,0);
    expect(resultado.hcRequeridoTotal).toBe(3);
    expect(resultado.costoMensualTotal).toBeCloseTo(sumaCosto,2);
  });
});
