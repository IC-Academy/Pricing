// ============================================================================
// Price Model 365 — Core domain types
// ============================================================================

export type RoleId = "SUPERADMIN" | "ADMIN_FUNCIONAL" | "PRICING" | "VENTAS";
export interface Role { id: RoleId; label: string; description: string; }
export interface PricingPermissions {
  editSalarios: boolean; editImpuestos: boolean; editUniformes: boolean; editVehiculos: boolean; editEquipamiento: boolean;
  resolverExcepciones: boolean; consultarAuditoria: boolean;
}
export const EMPTY_PRICING_PERMISSIONS: PricingPermissions = {
  editSalarios:false, editImpuestos:false, editUniformes:false, editVehiculos:false, editEquipamiento:false,
  resolverExcepciones:false, consultarAuditoria:false,
};
export interface User {
  id:string; fullName:string; cargo?:string; email:string; role:RoleId; active:boolean; permissions?:PricingPermissions; createdAt:string;
}

export type CatalogType = "SALARIOS" | "IMPUESTOS" | "UNIFORMES" | "VEHICULOS" | "EQUIPAMIENTO";
export type VigenciaEstado = "VIGENTE" | "PROXIMO_A_VENCER" | "VENCIDO" | "SIN_VIGENCIA";
export interface CatalogItem {
  id:string; catalogType:CatalogType; nombre:string; categoria:string; ubicacion:string; valor:number; unidad:string;
  valorMin?:number; valorMax?:number; fechaInicio:string; fechaVencimiento:string; responsable:string;
  ultimaActualizacion:string; usuarioModifico:string; diasAnticipacionAlerta:number; activo:boolean; comentarios?:string;
}
export interface CatalogHistoryEntry {
  id:string; catalogItemId:string; fecha:string; usuario:string; campoAnterior:Record<string,unknown>; campoNuevo:Record<string,unknown>; comentario?:string;
}

export type NotificationSeverity = "info" | "warning" | "critical";
export interface NotificationItem {
  id:string; title:string; message:string; severity:NotificationSeverity; createdAt:string; read:boolean;
  relatedCatalogItemId?:string; channel:"in_app"|"outlook"|"teams";
}

export const CIUDADES_DEMO = ["CDMX", "Querétaro", "Guadalajara"] as const;
export type CiudadDemo = (typeof CIUDADES_DEMO)[number];
export const ESTADO_POR_CIUDAD: Record<CiudadDemo,string> = {
  CDMX:"Ciudad de México", "Querétaro":"Querétaro", Guadalajara:"Jalisco",
};

export type PerfilPuesto = "Guardia Intramuros" | "Guardia Armado" | "Supervisor";
export type NivelPerfil = "A" | "AA" | "ELITE";
export type TipoExamen = "MEDICO" | "ANTIDOPING" | "POLIGRAFO" | "SOCIOECONOMICO" | "AUDIOMETRIA_OPTOMETRIA" | "PSICOMETRIA";
export type MonedaCotizacion = "MXN" | "USD";

export interface SeleccionCatalogoCotizacion {
  id:string;
  familia:"UNIFORME"|"EQUIPO"|"VEHICULO";
  concepto:string;
  opcion:string;
  costoMensual:number;
  esOtro?:boolean;
  descripcionOtro?:string;
}

export interface PuestoCotizado {
  id:string;
  tipoPuesto:PerfilPuesto;
  nivelPerfil?:NivelPerfil;
  cantidadPosiciones:number;
  cobertura:"24x7"|"12x7"|"12x5"|"8x6"|"Diurna"|"Nocturna";
  horas:number;
  dias:number;
  salarioMensual:number;
  uniformeCosto:number;
  equipoCosto:number;
  vehiculoOpcional:boolean;
  vehiculoCosto:number;
  examenes?:TipoExamen[];
  costoExamenesMensualizado?:number;
  seleccionesCatalogo?:SeleccionCatalogoCotizacion[];
}

export interface ParametrosComerciales {
  grossMarginObjetivo:number;
  vigenciaPropuestaDias:number;
  observaciones?:string;
  opcionales?:string;
  moneda?:MonedaCotizacion;
  tipoCambioUsdMxn?:number;
}

export interface DatosGenerales {
  cliente:string; nombreOportunidad:string; ciudad:CiudadDemo; estado:string; fecha:string; vendedorId:string; vendedorNombre:string;
}

export interface ParametrosSnapshot { tomadoEl:string; items:CatalogItem[]; }

export interface DesgloseCostoLaboral {
  sueldoBaseMensual:number;
  aguinaldoMensualizado:number;
  vacacionesMensualizadas:number;
  primaVacacionalMensualizada:number;
  cargaSocialReferencia:number;
  isn:number;
  riesgoTrabajo:number;
  costoLaboralTotal:number;
}

export interface PuestoCalculado extends PuestoCotizado {
  costoLaboralMensual:number;
  desgloseLaboral?:DesgloseCostoLaboral;
  costoMensualTotal:number;
  costoAnualTotal?:number;
  precioRecomendadoUnitario:number;
  precioTotalPuesto:number;
  precioAnualPuesto?:number;
}

export interface ResultadoCalculo {
  puestos:PuestoCalculado[];
  costoMensualTotal:number;
  costoAnualTotal?:number;
  precioMensualTotal:number;
  precioAnualTotal?:number;
  precioMensualUsd?:number;
  precioAnualUsd?:number;
  margenAplicado:number;
}

export type QuotationStatus = "BORRADOR"|"CALCULADA"|"PENDIENTE_VALIDACION"|"VALIDADA"|"PROPUESTA_GENERADA"|"CANCELADA";
export interface Quotation {
  id:string; folio:string; datosGenerales:DatosGenerales; puestos:PuestoCotizado[]; parametrosComerciales:ParametrosComerciales;
  resultado?:ResultadoCalculo; parametrosSnapshot?:ParametrosSnapshot; status:QuotationStatus; createdAt:string; updatedAt:string;
  createdBy:string; exceptionIds:string[];
}

export type ExceptionStatus = "PENDIENTE"|"ACEPTADA"|"RECHAZADA"|"AJUSTE_SOLICITADO"|"CONVERTIDA_A_PARAMETRO";
export interface ValidationException {
  id:string; quotationId:string; quotationFolio:string; clienteNombre:string; vendedorNombre:string; campo:string;
  valorCapturado:number; valorEsperadoMin:number; valorEsperadoMax:number; diferenciaAbsoluta:number; diferenciaPorcentual:number;
  fecha:string; status:ExceptionStatus; comentarioResolucion?:string; resueltoPor?:string; resueltoEn?:string; relatedCatalogItemId?:string;
}

export type AuditEntity = "CATALOGO"|"PARAMETRO"|"USUARIO"|"PERMISO"|"EXCEPCION"|"COTIZACION";
export interface AuditLogEntry {
  id:string; entidad:AuditEntity; entidadId:string; descripcion:string; valorAnterior?:string; valorNuevo?:string; usuario:string; fecha:string; comentario?:string;
}

export interface BenchmarkEntry {
  id:string; puesto:PerfilPuesto; ciudad:CiudadDemo; tarifaMercadoMensual:number; fuente:string; fechaActualizacion:string;
  fechaVencimiento:string; diasAnticipacionAlerta:number; responsable:string; activo:boolean; comentarios?:string;
}

export interface GlobalConfig { ultimaActualizacionModelo:string; defaultDiasAnticipacionAlerta:number; }
