import { describe, expect, it } from "vitest";
import { calcularHcRequeridoPuesto, calcularHcRequeridoTotal } from "./index";
import type { PuestoCotizado } from "../../types";

function puesto(overrides:Partial<PuestoCotizado>={}):PuestoCotizado{
  return {id:"p",tipoPuesto:"Guardia Intramuros",cantidadPosiciones:1,cobertura:"12x7",horas:12,dias:7,salarioMensual:10000,uniformeCosto:0,equipoCosto:0,vehiculoOpcional:false,vehiculoCosto:0,...overrides};
}

describe("staffing esquema 72",()=>{
  it("12x5 mantiene mínimo una persona por posición",()=>{
    const r=calcularHcRequeridoPuesto(puesto({cobertura:"12x5",horas:12,dias:5}));
    expect(r.horasSemana).toBe(60);
    expect(r.hcRequerido).toBe(1);
  });
  it("12x7 requiere 2 HC por posición",()=>{
    expect(calcularHcRequeridoPuesto(puesto({horas:12,dias:7})).hcRequerido).toBe(2);
  });
  it("24x7 requiere 3 HC por posición",()=>{
    expect(calcularHcRequeridoPuesto(puesto({cobertura:"24x7",horas:24,dias:7})).hcRequerido).toBe(3);
  });
  it("acumula grupos de puestos",()=>{
    expect(calcularHcRequeridoTotal([puesto({cantidadPosiciones:5}),puesto({id:"p2",cantidadPosiciones:2,horas:8,dias:6,cobertura:"8x6"})])).toBe(12);
  });
});
