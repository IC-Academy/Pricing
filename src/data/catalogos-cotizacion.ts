export type CatalogoCotizacionTipo = "EQUIPO" | "UNIFORME" | "VEHICULO";

export interface OpcionCatalogoCotizacion {
  id:string; tipo:CatalogoCotizacionTipo; concepto:string; nombre:string; precioMensual:number|null; unidad:string; fuente:string; requiereValidacion?:boolean;
}

export const TIPOS_GUARDIA_DEMO = [
  { id:"guardia-intramuros", value:"Guardia Intramuros", label:"Guardia Intramuros" },
  { id:"guardia-armado", value:"Guardia Armado", label:"Guardia Armado" },
  { id:"guardia-bilingue", value:"Guardia Bilingüe", label:"Guardia Bilingüe" },
  { id:"senior-guard-bilingue", value:"Senior Guard Bilingüe", label:"Senior Guard Bilingüe" },
  { id:"supervisor", value:"Supervisor", label:"Supervisor" },
] as const;

export const TURNOS_DEMO = [
  { id:"12x7", nombre:"12x7", label:"12x7", horas:12, diasSemana:7 },
  { id:"12x5", nombre:"12x5", label:"12x5", horas:12, diasSemana:5 },
  { id:"8x6", nombre:"8x6", label:"8x6", horas:8, diasSemana:6 },
  { id:"24x7", nombre:"24x7", label:"24x7", horas:24, diasSemana:7 },
  { id:"Diurna", nombre:"Diurna", label:"Diurna", horas:12, diasSemana:7 },
  { id:"Nocturna", nombre:"Nocturna", label:"Nocturna", horas:12, diasSemana:7 },
] as const;

export const OPCIONES_CATALOGO_COTIZACION:OpcionCatalogoCotizacion[] = [
  { id:"eq-radio-base", tipo:"EQUIPO", concepto:"Radio", nombre:"Radio de comunicación", precioMensual:180, unidad:"MXN/mes", fuente:"Catálogo demo Pricing 2026" },
  { id:"eq-chaleco-iiia", tipo:"EQUIPO", concepto:"Protección", nombre:"Chaleco antibalas NIJ IIIA", precioMensual:260, unidad:"MXN/mes", fuente:"Catálogo demo Pricing 2026" },
  { id:"eq-lampara-otro", tipo:"EQUIPO", concepto:"Lámpara", nombre:"Otro / Especifique", precioMensual:null, unidad:"MXN/mes", fuente:"Pendiente de catálogo Pricing", requiereValidacion:true },
  { id:"eq-garrett-otro", tipo:"EQUIPO", concepto:"Garrett / Detector", nombre:"Otro / Especifique", precioMensual:null, unidad:"MXN/mes", fuente:"Pendiente de catálogo Pricing", requiereValidacion:true },
  { id:"eq-radio-otro", tipo:"EQUIPO", concepto:"Radio", nombre:"Otro / Especifique", precioMensual:null, unidad:"MXN/mes", fuente:"Pendiente de catálogo Pricing", requiereValidacion:true },
  { id:"eq-proteccion-otro", tipo:"EQUIPO", concepto:"Protección", nombre:"Otro / Especifique", precioMensual:null, unidad:"MXN/mes", fuente:"Pendiente de catálogo Pricing", requiereValidacion:true },
  { id:"eq-otro", tipo:"EQUIPO", concepto:"Otro", nombre:"Otro / Especifique", precioMensual:null, unidad:"MXN/mes", fuente:"Pendiente de catálogo Pricing", requiereValidacion:true },
  { id:"un-intramuros", tipo:"UNIFORME", concepto:"Kit uniforme", nombre:"Uniforme Guardia Intramuros", precioMensual:350, unidad:"MXN/mes", fuente:"Catálogo demo Pricing 2026" },
  { id:"un-armado", tipo:"UNIFORME", concepto:"Kit uniforme", nombre:"Uniforme Guardia Armado", precioMensual:420, unidad:"MXN/mes", fuente:"Catálogo demo Pricing 2026" },
  { id:"un-supervisor", tipo:"UNIFORME", concepto:"Kit uniforme", nombre:"Uniforme Supervisor", precioMensual:480, unidad:"MXN/mes", fuente:"Catálogo demo Pricing 2026" },
  { id:"un-otro", tipo:"UNIFORME", concepto:"Kit uniforme", nombre:"Otro / Especifique", precioMensual:null, unidad:"MXN/mes", fuente:"Pendiente de catálogo Pricing", requiereValidacion:true },
  { id:"veh-sedan", tipo:"VEHICULO", concepto:"Vehículo", nombre:"Vehículo Sedán de Ronda", precioMensual:9800, unidad:"MXN/mes", fuente:"Catálogo demo Pricing 2026" },
  { id:"veh-camioneta", tipo:"VEHICULO", concepto:"Vehículo", nombre:"Camioneta de Supervisión", precioMensual:14500, unidad:"MXN/mes", fuente:"Catálogo demo Pricing 2026" },
  { id:"veh-otro", tipo:"VEHICULO", concepto:"Vehículo", nombre:"Otro / Especifique", precioMensual:null, unidad:"MXN/mes", fuente:"Pendiente de catálogo Pricing", requiereValidacion:true },
];

export function conceptosPorTipo(tipo:CatalogoCotizacionTipo):string[]{return [...new Set(OPCIONES_CATALOGO_COTIZACION.filter((x)=>x.tipo===tipo).map((x)=>x.concepto))];}
export function opcionesPorConcepto(tipo:CatalogoCotizacionTipo,concepto:string):OpcionCatalogoCotizacion[]{return OPCIONES_CATALOGO_COTIZACION.filter((x)=>x.tipo===tipo&&x.concepto===concepto);}
export function opcionPorId(id:string):OpcionCatalogoCotizacion|undefined{return OPCIONES_CATALOGO_COTIZACION.find((x)=>x.id===id);}
