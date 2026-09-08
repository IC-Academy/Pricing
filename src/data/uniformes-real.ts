// ============================================================================
// Catálogo real de uniformes 2025-2026
// Fuente: Costo uniforme 2025-2026.xlsx / Uniformes Precios
// Los importes son costo de kit/entrega, NO costo mensual. La periodicidad de
// reposición/amortización debe validarse con Pricing antes de llevarla al motor.
// ============================================================================

export interface UniformeItemReal {
  linea:string;
  nombre:string;
  cantidad:number;
  costoUnitario:number|null;
  costoTotal:number;
  eliminado?:boolean;
}

export interface UniformeKitReal {
  id:string;
  grupo:string;
  nombre:string;
  cantidadPiezas:number;
  costoKit:number;
  fuente:string;
  items:UniformeItemReal[];
}

export const UNIFORMES_KITS_REAL:UniformeKitReal[] = [
  {
    id:"uniforme-empresarial",
    grupo:"COMERCIAL",
    nombre:"EMPRESARIAL",
    cantidadPiezas:17,
    costoKit:1770.612025,
    fuente:"Costo uniforme 2025-2026.xlsx / Uniformes Precios",
    items:[
      {linea:"Camisa",nombre:"CAMISA BCA C/FRANJA MC",cantidad:1,costoUnitario:195.60555,costoTotal:195.60555},
      {linea:"Camisa",nombre:"CAMISA BCA C/FRANJA ML",cantidad:1,costoUnitario:196.79625,costoTotal:196.79625},
      {linea:"Pantalón",nombre:"PANTALON AZUL C/FRANJA",cantidad:2,costoUnitario:141.946875,costoTotal:283.89375},
      {linea:"Complementos",nombre:"CORBATA AZUL",cantidad:2,costoUnitario:23.61555,costoTotal:47.2311},
      {linea:"Complementos",nombre:"GORRA NEGRA",cantidad:1,costoUnitario:39,costoTotal:39},
      {linea:"Sueter",nombre:"SUETER COMANDO",cantidad:1,costoUnitario:277.554375,costoTotal:277.554375},
      {linea:"Chamarra",nombre:"CHAMARRA NEGRA",cantidad:1,costoUnitario:338.3415,costoTotal:338.3415},
      {linea:"Complementos",nombre:"FORNITURA",cantidad:1,costoUnitario:39.52,costoTotal:39.52},
      {linea:"Complementos",nombre:"PORTA RADIO",cantidad:1,costoUnitario:19,costoTotal:19},
      {linea:"Botas",nombre:"BOTA DIELECTRICA",cantidad:1,costoUnitario:327.1695,costoTotal:327.1695},
      {linea:"Complementos",nombre:"PALAS 1 BARRA",cantidad:1,costoUnitario:null,costoTotal:0,eliminado:true},
      {linea:"Complementos",nombre:"CORDON DE MANDO AZUL",cantidad:1,costoUnitario:null,costoTotal:0,eliminado:true},
      {linea:"Complementos",nombre:"SILBATO",cantidad:1,costoUnitario:6.5,costoTotal:6.5},
      {linea:"Complementos",nombre:"GAFETE AZUL",cantidad:1,costoUnitario:null,costoTotal:0,eliminado:true},
    ],
  },
  {
    id:"uniforme-use-comando",
    grupo:"US.E",
    nombre:"COMANDO",
    cantidadPiezas:29,
    costoKit:3744.746075,
    fuente:"Costo uniforme 2025-2026.xlsx / Uniformes Precios",
    items:[
      {linea:"Botas",nombre:"BOTA EMPRESARIAL",cantidad:2,costoUnitario:316.1655,costoTotal:632.331},
      {linea:"Botas",nombre:"BOTA DE HULE",cantidad:1,costoUnitario:199.5,costoTotal:199.5},
      {linea:"Complementos",nombre:"CALCETIN",cantidad:6,costoUnitario:13.755,costoTotal:82.53},
      {linea:"Camisa",nombre:"CAMISA GRIS EMPR ML",cantidad:3,costoUnitario:174.470625,costoTotal:523.411875},
      {linea:"Camisa",nombre:"CAMISA GRIS EMPR MC",cantidad:3,costoUnitario:173.279925,costoTotal:519.839775},
      {linea:"Chamarra",nombre:"CHAMARRA EMBAJADA",cantidad:1,costoUnitario:601.490925,costoTotal:601.490925},
      {linea:"Complementos",nombre:"CINTURON EMBAJADA",cantidad:1,costoUnitario:39,costoTotal:39},
      {linea:"Complementos",nombre:"FORNITURA",cantidad:1,costoUnitario:39.52,costoTotal:39.52},
      {linea:"Complementos",nombre:"GORRA NEGRA",cantidad:2,costoUnitario:39,costoTotal:78},
      {linea:"Complementos",nombre:"MANGA DE LLUVIA",cantidad:1,costoUnitario:225,costoTotal:225},
      {linea:"Pantalón",nombre:"PANTALON COMANDO NEGRO",cantidad:3,costoUnitario:160.689375,costoTotal:482.068125},
      {linea:"Complementos",nombre:"PORTA LAMPARA",cantidad:1,costoUnitario:19,costoTotal:19},
      {linea:"Complementos",nombre:"LAMPARA",cantidad:1,costoUnitario:null,costoTotal:0},
      {linea:"Complementos",nombre:"PORTA RADIO",cantidad:1,costoUnitario:19,costoTotal:19},
      {linea:"Complementos",nombre:"SILBATO",cantidad:1,costoUnitario:6.5,costoTotal:6.5},
      {linea:"Sueter",nombre:"SUETER COMANDO",cantidad:1,costoUnitario:277.554375,costoTotal:277.554375},
    ],
  },
  {
    id:"uniforme-empresarial-algodon",
    grupo:"COMERCIAL",
    nombre:"EMPRESARIAL ALGODÓN",
    cantidadPiezas:17,
    costoKit:1890.226475,
    fuente:"Costo uniforme 2025-2026.xlsx / Uniformes Precios",
    items:[],
  },
  {
    id:"uniforme-comercial-comando",
    grupo:"COMERCIAL",
    nombre:"COMANDO",
    cantidadPiezas:14,
    costoKit:1705.710675,
    fuente:"Costo uniforme 2025-2026.xlsx / Uniformes Precios",
    items:[],
  },
  {
    id:"uniforme-comercial-civil",
    grupo:"COMERCIAL",
    nombre:"CIVIL",
    cantidadPiezas:11,
    costoKit:2172.16755,
    fuente:"Costo uniforme 2025-2026.xlsx / Uniformes Precios",
    items:[],
  },
  {
    id:"uniforme-comercial-comando-algodon",
    grupo:"COMERCIAL",
    nombre:"COMANDO ALGODÓN",
    cantidadPiezas:14,
    costoKit:1888.204875,
    fuente:"Costo uniforme 2025-2026.xlsx / Uniformes Precios",
    items:[],
  },
];

export function uniformeKitPorId(id:string){return UNIFORMES_KITS_REAL.find((x)=>x.id===id);}
