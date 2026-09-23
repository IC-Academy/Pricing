import { describe, expect, it } from "vitest";
import { calcularHcRequeridoPuesto, calcularHcRequeridoTotal } from "./index";
import type { PuestoCotizado } from "../../types";

function puesto(overrides:Partial<PuestoCotizado>={}):PuestoCotizado{
  return {id:"p",tipoPuesto:"Guardia Intramuros",cantidadPosiciones:1,cobertura:"12x7",horas:12,dias:7,esquemaHoras:72,contingenciaPct:0,salarioMensual:10000,uniformeCosto:0,equipoCosto:0,vehiculoOpcional:false,vehiculoCosto:0,...overrides};
}

describe("staffing flexible",()=>{
  it("12x5 con esquema 72 mantiene mínimo una persona por posición",()=>{
    const r=calcularHcRequeridoPuesto(puesto({cobertura:"12x5",horas:12,dias:5}));
    expect(r.horasSemana).toBe(60);
    expect(r.hcBase).toBe(1);
    expect(r.hcTotal).toBe(1);
  });
  it("12x7 con esquema 72 requiere 2 HC por posición",()=>{
    expect(calcularHcRequeridoPuesto(puesto({horas:12,dias:7})).hcTotal).toBe(2);
  });
  it("acepta esquema manual con decimales",()=>{
    const r=calcularHcRequeridoPuesto(puesto({horas:5,dias:5,esquemaHoras:10.5}));
    expect(r.esquemaHoras).toBe(10.5);
    expect(r.hcBase).toBe(3);
  });
  it("separa base, contingencia y total",()=>{
    const r=calcularHcRequeridoPuesto(puesto({cantidadPosiciones:5,horas:12,dias:7,contingenciaPct:0.1}));
    expect(r.hcBase).toBe(6);
    expect(r.hcContingencia).toBe(1);
    expect(r.hcTotal).toBe(7);
  });
  it("acumula HC total de varios grupos",()=>{
    const total=calcularHcRequeridoTotal([
      puesto({cantidadPosiciones:5}),
      puesto({id:"p2",cantidadPosiciones:2,horas:8,dias:6,cobertura:"8x6"}),
    ]);
    expect(total).toBe(8);
  });
});
