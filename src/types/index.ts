// ============================================================================
// Price Model 365 — Core domain types
// These types define the contracts between modules. UI components and
// services should depend on these types, never on localStorage shapes
// directly, so the storage layer can be swapped later (API/SQL/M365)
// without touching business logic or screens.
// ============================================================================

// ---------------------------------------------------------------------------
// Roles & Users
// ---------------------------------------------------------------------------

export type RoleId = "SUPERADMIN" | "ADMIN_FUNCIONAL" | "PRICING" | "VENTAS";

export interface Role {
  id: RoleId;
  label: string;
  description: string;
}

/** Granular permission flags assignable to PRICING users by the Admin. */
export interface PricingPermissions {
  editSalarios: boolean;
  editImpuestos: boolean;
  editUniformes: boolean;
  editVehiculos: boolean;
  editEquipamiento: boolean;
  resolverExcepciones: boolean;
  consultarAuditoria: boolean;
}

export const EMPTY_PRICING_PERMISSIONS: PricingPermissions = {
  editSalarios: false,
  editImpuestos: false,
  editUniformes: false,
  editVehiculos: false,
  editEquipamiento: false,
  resolverExcepciones: false,
  consultarAuditoria: false,
};

export interface User {
  id: string;
  fullName: string;
  cargo?: string;
  email: string;
  role: RoleId;
  active: boolean;
  /** Only meaningful when role === "PRICING"; ignored otherwise. */
  permissions?: PricingPermissions;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Catalogs
// ---------------------------------------------------------------------------

export type CatalogType =
  | "SALARIOS"
  | "IMPUESTOS"
  | "UNIFORMES"
  | "VEHICULOS"
  | "EQUIPAMIENTO";

export type VigenciaEstado = "VIGENTE" | "PROXIMO_A_VENCER" | "VENCIDO" | "SIN_VIGENCIA";

export interface CatalogItem {
  id: string;
  catalogType: CatalogType;
  nombre: string;
  categoria: string;
  ubicacion: string; // e.g. Ciudad/Estado
  valor: number;
  unidad: string; // e.g. "MXN/mes", "%", "MXN"
  /** Optional secondary bound so ranges (min/max) can be modeled, e.g. salarios. */
  valorMin?: number;
  valorMax?: number;
  fechaInicio: string; // ISO date
  fechaVencimiento: string; // ISO date
  responsable: string;
  ultimaActualizacion: string; // ISO datetime
  usuarioModifico: string;
  diasAnticipacionAlerta: number;
  activo: boolean;
  comentarios?: string;
}

export interface CatalogHistoryEntry {
  id: string;
  catalogItemId: string;
  fecha: string;
  usuario: string;
  campoAnterior: Record<string, unknown>;
  campoNuevo: Record<string, unknown>;
  comentario?: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationSeverity = "info" | "warning" | "critical";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: string;
  read: boolean;
  relatedCatalogItemId?: string;
  /** Marks the delivery channel this alert is prepared for; only "in_app" is wired up in the demo. */
  channel: "in_app" | "outlook" | "teams";
}

// ---------------------------------------------------------------------------
// Sales / quoting domain
// ---------------------------------------------------------------------------

export const CIUDADES_DEMO = ["CDMX", "Querétaro", "Guadalajara"] as const;
export type CiudadDemo = (typeof CIUDADES_DEMO)[number];

export const ESTADO_POR_CIUDAD: Record<CiudadDemo, string> = {
  CDMX: "Ciudad de México",
  "Querétaro": "Querétaro",
  Guadalajara: "Jalisco",
};

export type PerfilPuesto = "Guardia Intramuros" | "Guardia Armado" | "Supervisor";

export interface PuestoCotizado {
  id: string;
  tipoPuesto: PerfilPuesto;
  cantidadPosiciones: number;
  cobertura: "24x7" | "12x7" | "Diurna" | "Nocturna";
  horas: number;
  dias: number;
  salarioMensual: number;
  uniformeCosto: number;
  equipoCosto: number;
  vehiculoOpcional: boolean;
  vehiculoCosto: number;
}

export interface ParametrosComerciales {
  grossMarginObjetivo: number; // 0-1
  vigenciaPropuestaDias: number;
  observaciones?: string;
  opcionales?: string;
}

export interface DatosGenerales {
  cliente: string;
  nombreOportunidad: string;
  ciudad: CiudadDemo;
  estado: string;
  fecha: string;
  vendedorId: string;
  vendedorNombre: string;
}

/** A frozen copy of the catalog values used to calculate a quotation, so the
 * quotation never changes retroactively when catalogs are later edited. */
export interface ParametrosSnapshot {
  tomadoEl: string;
  items: CatalogItem[];
}

export interface PuestoCalculado extends PuestoCotizado {
  costoLaboralMensual: number;
  costoMensualTotal: number;
  precioRecomendadoUnitario: number;
  precioTotalPuesto: number;
}

export interface ResultadoCalculo {
  puestos: PuestoCalculado[];
  costoMensualTotal: number;
  precioMensualTotal: number;
  margenAplicado: number;
}

export type QuotationStatus =
  | "BORRADOR"
  | "CALCULADA"
  | "PENDIENTE_VALIDACION"
  | "VALIDADA"
  | "PROPUESTA_GENERADA"
  | "CANCELADA";

export interface Quotation {
  id: string;
  folio: string; // PM-2026-00001
  datosGenerales: DatosGenerales;
  puestos: PuestoCotizado[];
  parametrosComerciales: ParametrosComerciales;
  resultado?: ResultadoCalculo;
  parametrosSnapshot?: ParametrosSnapshot;
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // userId
  exceptionIds: string[];
}

// ---------------------------------------------------------------------------
// Validation / exceptions
// ---------------------------------------------------------------------------

export type ExceptionStatus =
  | "PENDIENTE"
  | "ACEPTADA"
  | "RECHAZADA"
  | "AJUSTE_SOLICITADO"
  | "CONVERTIDA_A_PARAMETRO";

export interface ValidationException {
  id: string;
  quotationId: string;
  quotationFolio: string;
  clienteNombre: string;
  vendedorNombre: string;
  campo: string; // e.g. "Salario - Guardia Intramuros - Querétaro"
  valorCapturado: number;
  valorEsperadoMin: number;
  valorEsperadoMax: number;
  diferenciaAbsoluta: number;
  diferenciaPorcentual: number;
  fecha: string;
  status: ExceptionStatus;
  comentarioResolucion?: string;
  resueltoPor?: string;
  resueltoEn?: string;
  relatedCatalogItemId?: string;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export type AuditEntity = "CATALOGO" | "PARAMETRO" | "USUARIO" | "PERMISO" | "EXCEPCION" | "COTIZACION";

export interface AuditLogEntry {
  id: string;
  entidad: AuditEntity;
  entidadId: string;
  descripcion: string;
  valorAnterior?: string;
  valorNuevo?: string;
  usuario: string;
  fecha: string;
  comentario?: string;
}

// ---------------------------------------------------------------------------
// Benchmark (market rate reference)
// ---------------------------------------------------------------------------

export interface BenchmarkEntry {
  id: string;
  puesto: PerfilPuesto;
  ciudad: CiudadDemo;
  tarifaMercadoMensual: number;
  fuente: string;
  fechaActualizacion: string;
  fechaVencimiento: string;
  diasAnticipacionAlerta: number;
  responsable: string;
  activo: boolean;
  comentarios?: string;
}

// ---------------------------------------------------------------------------
// Global configuration
// ---------------------------------------------------------------------------

export interface GlobalConfig {
  ultimaActualizacionModelo: string;
  defaultDiasAnticipacionAlerta: number;
}
