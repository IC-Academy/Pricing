// ============================================================================
// Demo data seed
// ----------------------------------------------------------------------------
// Generates a full, internally-consistent demo dataset: users, catalogs
// (with some expiring/expired on purpose), quotations in every status,
// exceptions, audit history and benchmark entries. All dates are computed
// relative to "now" at seed time so the demo always looks fresh, whenever
// it's actually run — re-run via "Restablecer datos demo" in Configuración.
// ============================================================================

import type {
  User,
  CatalogItem,
  CatalogHistoryEntry,
  NotificationItem,
  Quotation,
  ValidationException,
  AuditLogEntry,
  GlobalConfig,
  BenchmarkEntry,
  CatalogType,
  PerfilPuesto,
  CiudadDemo,
  PuestoCotizado,
} from "../types";
import { ESTADO_POR_CIUDAD } from "../types";
import { calcularCotizacion } from "../modules/pricing-engine";

// ---- date helpers ----------------------------------------------------------

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(9, 30, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}
function dateOnly(days: number): string {
  return daysFromNow(days).toISOString();
}
function isoAt(days: number, hh: number, mm: number): string {
  const d = daysFromNow(days);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

let idCounter = 0;
function id(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter.toString().padStart(4, "0")}`;
}

// ---- Users ------------------------------------------------------------------

function buildUsers(): User[] {
  return [
    {
      id: "u-superadmin",
      fullName: "Jorge Mejía",
      cargo: "Superadmin Técnico",
      email: "jorge.mejia@intercon.com.mx",
      role: "SUPERADMIN",
      active: true,
      createdAt: dateOnly(-240),
    },
    {
      id: "u-admin",
      fullName: "Jorge Martinez",
      cargo: "Coordinador de Precios y Admon de Contratos",
      email: "jorge.martinez@intercon.com.mx",
      role: "ADMIN_FUNCIONAL",
      active: true,
      createdAt: dateOnly(-238),
    },
    {
      id: "u-pricing-1",
      fullName: "Laura Sánchez",
      cargo: "Analista de Pricing Sr.",
      email: "laura.sanchez@intercon.com.mx",
      role: "PRICING",
      active: true,
      permissions: {
        editSalarios: true,
        editImpuestos: true,
        editUniformes: false,
        editVehiculos: false,
        editEquipamiento: false,
        resolverExcepciones: true,
        consultarAuditoria: true,
      },
      createdAt: dateOnly(-200),
    },
    {
      id: "u-pricing-2",
      fullName: "Miguel Torres",
      cargo: "Analista de Pricing",
      email: "miguel.torres@intercon.com.mx",
      role: "PRICING",
      active: true,
      permissions: {
        editSalarios: false,
        editImpuestos: false,
        editUniformes: true,
        editVehiculos: true,
        editEquipamiento: true,
        resolverExcepciones: true,
        consultarAuditoria: false,
      },
      createdAt: dateOnly(-190),
    },
    {
      id: "u-ventas-1",
      fullName: "Ana Ruiz",
      cargo: "Ejecutiva de Ventas",
      email: "ana.ruiz@intercon.com.mx",
      role: "VENTAS",
      active: true,
      createdAt: dateOnly(-180),
    },
    {
      id: "u-ventas-2",
      fullName: "Carlos Vega",
      cargo: "Ejecutivo de Ventas",
      email: "carlos.vega@intercon.com.mx",
      role: "VENTAS",
      active: true,
      createdAt: dateOnly(-170),
    },
    {
      id: "u-ventas-3",
      fullName: "Sofía Ramírez",
      cargo: "Ejecutiva de Ventas Senior",
      email: "sofia.ramirez@intercon.com.mx",
      role: "VENTAS",
      active: true,
      createdAt: dateOnly(-160),
    },
  ];
}

// ---- Catalogs -----------------------------------------------------------

interface SalarioSpec {
  puesto: PerfilPuesto;
  ciudad: CiudadDemo;
  min: number;
  max: number;
}

const SALARIOS_SPEC: SalarioSpec[] = [
  { puesto: "Guardia Intramuros", ciudad: "CDMX", min: 11000, max: 12500 },
  { puesto: "Guardia Intramuros", ciudad: "Querétaro", min: 10500, max: 12000 },
  { puesto: "Guardia Intramuros", ciudad: "Guadalajara", min: 10800, max: 12200 },
  { puesto: "Guardia Armado", ciudad: "CDMX", min: 13500, max: 15000 },
  { puesto: "Guardia Armado", ciudad: "Querétaro", min: 13000, max: 14500 },
  { puesto: "Guardia Armado", ciudad: "Guadalajara", min: 13200, max: 14800 },
  { puesto: "Supervisor", ciudad: "CDMX", min: 16000, max: 18000 },
  { puesto: "Supervisor", ciudad: "Querétaro", min: 15500, max: 17500 },
  { puesto: "Supervisor", ciudad: "Guadalajara", min: 15800, max: 17800 },
];

function buildCatalogItems(
  admin: User
): { items: CatalogItem[]; history: CatalogHistoryEntry[]; salarioQroId: string; sedanId: string } {
  const items: CatalogItem[] = [];
  const history: CatalogHistoryEntry[] = [];

  // --- Salarios: 9 records, all vigentes (1 year window, started ~90 days ago)
  SALARIOS_SPEC.forEach((s) => {
    items.push({
      id: id("cat-sal"),
      catalogType: "SALARIOS",
      nombre: s.puesto,
      categoria: "Sueldos base",
      ubicacion: s.ciudad,
      valor: Math.round((s.min + s.max) / 2),
      unidad: "MXN/mes",
      valorMin: s.min,
      valorMax: s.max,
      fechaInicio: dateOnly(-90),
      fechaVencimiento: dateOnly(275),
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-14, 9, 30),
      usuarioModifico: "Laura Sánchez",
      diasAnticipacionAlerta: 30,
      activo: true,
      comentarios: "Benchmark salarial revisado trimestralmente.",
    });
  });

  // One salary record with a recent correction — feeds the audit example
  // "Salario Guardia Querétaro = $11,500 → $12,000".
  const salarioQro = items.find((i) => i.nombre === "Guardia Intramuros" && i.ubicacion === "Querétaro")!;
  history.push({
    id: id("hist"),
    catalogItemId: salarioQro.id,
    fecha: isoAt(-6, 9, 27),
    usuario: "Jorge Martinez",
    campoAnterior: { valorMax: 11500 },
    campoNuevo: { valorMax: 12000 },
    comentario: "Actualización benchmark septiembre",
  });

  // --- Impuestos: 4 records
  items.push(
    {
      id: id("cat-imp"),
      catalogType: "IMPUESTOS",
      nombre: "Impuesto sobre Nómina",
      categoria: "Impuestos estatales",
      ubicacion: "Jalisco",
      valor: 3,
      unidad: "%",
      fechaInicio: dateOnly(-247),
      fechaVencimiento: dateOnly(118), // ~31 Dec 2026 relative-ish; also lands "próximo a vencer" if <30d
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-30, 11, 0),
      usuarioModifico: "Laura Sánchez",
      diasAnticipacionAlerta: 30,
      activo: true,
      comentarios: "Tasa vigente conforme Ley de Hacienda del Estado de Jalisco.",
    },
    {
      id: id("cat-imp"),
      catalogType: "IMPUESTOS",
      nombre: "Impuesto sobre Nómina",
      categoria: "Impuestos estatales",
      ubicacion: "Ciudad de México",
      valor: 3,
      unidad: "%",
      fechaInicio: dateOnly(-247),
      fechaVencimiento: dateOnly(150),
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-30, 11, 0),
      usuarioModifico: "Laura Sánchez",
      diasAnticipacionAlerta: 30,
      activo: true,
    },
    {
      id: id("cat-imp"),
      catalogType: "IMPUESTOS",
      nombre: "Impuesto sobre Nómina",
      categoria: "Impuestos estatales",
      ubicacion: "Querétaro",
      valor: 2,
      unidad: "%",
      fechaInicio: dateOnly(-247),
      fechaVencimiento: dateOnly(150),
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-30, 11, 0),
      usuarioModifico: "Laura Sánchez",
      diasAnticipacionAlerta: 30,
      activo: true,
    },
    {
      id: id("cat-imp"),
      catalogType: "IMPUESTOS",
      nombre: "Cuota IMSS Patronal",
      categoria: "Seguridad social",
      ubicacion: "Nacional",
      valor: 26.5,
      unidad: "%",
      fechaInicio: dateOnly(-247),
      fechaVencimiento: dateOnly(300),
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-30, 11, 0),
      usuarioModifico: "Laura Sánchez",
      diasAnticipacionAlerta: 45,
      activo: true,
    }
  );

  // --- Uniformes: 3 records — one PRÓXIMO A VENCER on purpose
  items.push(
    {
      id: id("cat-uni"),
      catalogType: "UNIFORMES",
      nombre: "Uniforme Guardia Intramuros",
      categoria: "Uniformes",
      ubicacion: "Nacional",
      valor: 350,
      unidad: "MXN/mes (amortizado)",
      fechaInicio: dateOnly(-335),
      fechaVencimiento: dateOnly(18), // within alert window -> próximo a vencer
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-45, 10, 0),
      usuarioModifico: "Miguel Torres",
      diasAnticipacionAlerta: 30,
      activo: true,
      comentarios: "Incluye 2 mudas + calzado.",
    },
    {
      id: id("cat-uni"),
      catalogType: "UNIFORMES",
      nombre: "Uniforme Guardia Armado",
      categoria: "Uniformes",
      ubicacion: "Nacional",
      valor: 420,
      unidad: "MXN/mes (amortizado)",
      fechaInicio: dateOnly(-335),
      fechaVencimiento: dateOnly(200),
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-45, 10, 0),
      usuarioModifico: "Miguel Torres",
      diasAnticipacionAlerta: 30,
      activo: true,
    },
    {
      id: id("cat-uni"),
      catalogType: "UNIFORMES",
      nombre: "Uniforme Supervisor",
      categoria: "Uniformes",
      ubicacion: "Nacional",
      valor: 480,
      unidad: "MXN/mes (amortizado)",
      fechaInicio: dateOnly(-335),
      fechaVencimiento: dateOnly(200),
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-45, 10, 0),
      usuarioModifico: "Miguel Torres",
      diasAnticipacionAlerta: 30,
      activo: true,
    }
  );

  // --- Vehículos: 2 records — one VENCIDO on purpose
  const sedanId = id("cat-veh");
  items.push(
    {
      id: sedanId,
      catalogType: "VEHICULOS",
      nombre: "Vehículo Sedán de Ronda",
      categoria: "Flotilla",
      ubicacion: "Nacional",
      valor: 9800,
      unidad: "MXN/mes",
      fechaInicio: dateOnly(-400),
      fechaVencimiento: dateOnly(-12), // already expired
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-90, 12, 0),
      usuarioModifico: "Miguel Torres",
      diasAnticipacionAlerta: 30,
      activo: true,
      comentarios: "Pendiente renovar cotización con arrendadora.",
    },
    {
      id: id("cat-veh"),
      catalogType: "VEHICULOS",
      nombre: "Vehículo Camioneta de Supervisión",
      categoria: "Flotilla",
      ubicacion: "Nacional",
      valor: 14500,
      unidad: "MXN/mes",
      fechaInicio: dateOnly(-100),
      fechaVencimiento: dateOnly(265),
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-20, 12, 0),
      usuarioModifico: "Miguel Torres",
      diasAnticipacionAlerta: 30,
      activo: true,
    }
  );

  // --- Equipamiento: 3 records
  items.push(
    {
      id: id("cat-equ"),
      catalogType: "EQUIPAMIENTO",
      nombre: "Radio de comunicación",
      categoria: "Equipo",
      ubicacion: "Nacional",
      valor: 180,
      unidad: "MXN/mes (amortizado)",
      fechaInicio: dateOnly(-300),
      fechaVencimiento: dateOnly(230),
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-60, 9, 0),
      usuarioModifico: "Miguel Torres",
      diasAnticipacionAlerta: 30,
      activo: true,
    },
    {
      id: id("cat-equ"),
      catalogType: "EQUIPAMIENTO",
      nombre: "Chaleco antibalas NIJ IIIA",
      categoria: "Equipo de protección",
      ubicacion: "Nacional",
      valor: 260,
      unidad: "MXN/mes (amortizado)",
      fechaInicio: dateOnly(-300),
      fechaVencimiento: dateOnly(230),
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-60, 9, 0),
      usuarioModifico: "Miguel Torres",
      diasAnticipacionAlerta: 30,
      activo: true,
    },
    {
      id: id("cat-equ"),
      catalogType: "EQUIPAMIENTO",
      nombre: "Equipo de cómputo de garita",
      categoria: "Equipo",
      ubicacion: "Nacional",
      valor: 150,
      unidad: "MXN/mes (amortizado)",
      fechaInicio: dateOnly(-300),
      fechaVencimiento: dateOnly(230),
      responsable: "Pricing",
      ultimaActualizacion: isoAt(-60, 9, 0),
      usuarioModifico: "Miguel Torres",
      diasAnticipacionAlerta: 30,
      activo: true,
    }
  );

  // one inactive/deactivated record for realism (SIN_VIGENCIA)
  items.push({
    id: id("cat-equ"),
    catalogType: "EQUIPAMIENTO",
    nombre: "Radio de comunicación (modelo descontinuado)",
    categoria: "Equipo",
    ubicacion: "Nacional",
    valor: 200,
    unidad: "MXN/mes (amortizado)",
    fechaInicio: dateOnly(-500),
    fechaVencimiento: dateOnly(-100),
    responsable: "Pricing",
    ultimaActualizacion: isoAt(-100, 9, 0),
    usuarioModifico: admin.fullName,
    diasAnticipacionAlerta: 30,
    activo: false,
    comentarios: "Reemplazado por modelo vigente.",
  });

  return { items, history, salarioQroId: salarioQro.id, sedanId };
}

// ---- Benchmark ----------------------------------------------------------

function buildBenchmark(): BenchmarkEntry[] {
  const specs: { puesto: PerfilPuesto; ciudad: CiudadDemo; tarifa: number }[] = [
    { puesto: "Guardia Intramuros", ciudad: "CDMX", tarifa: 24500 },
    { puesto: "Guardia Intramuros", ciudad: "Querétaro", tarifa: 22800 },
    { puesto: "Guardia Armado", ciudad: "CDMX", tarifa: 29800 },
    { puesto: "Supervisor", ciudad: "Guadalajara", tarifa: 33500 },
  ];
  return specs.map((s) => ({
    id: id("bench"),
    puesto: s.puesto,
    ciudad: s.ciudad,
    tarifaMercadoMensual: s.tarifa,
    fuente: "Encuesta sectorial de seguridad privada 2026",
    fechaActualizacion: dateOnly(-25),
    fechaVencimiento: dateOnly(150),
    diasAnticipacionAlerta: 30,
    responsable: "Pricing",
    activo: true,
  }));
}

// ---- Quotations + exceptions ---------------------------------------------

const VENDEDORES = [
  { id: "u-ventas-1", nombre: "Ana Ruiz" },
  { id: "u-ventas-2", nombre: "Carlos Vega" },
  { id: "u-ventas-3", nombre: "Sofía Ramírez" },
];

function puesto(
  tipoPuesto: PerfilPuesto,
  cantidad: number,
  salario: number,
  opts: Partial<PuestoCotizado> = {}
): PuestoCotizado {
  return {
    id: id("puesto"),
    tipoPuesto,
    cantidadPosiciones: cantidad,
    cobertura: "24x7",
    horas: 12,
    dias: 30,
    salarioMensual: salario,
    uniformeCosto: 350,
    equipoCosto: 590,
    vehiculoOpcional: false,
    vehiculoCosto: 0,
    ...opts,
  };
}

interface QuotationSeedSpec {
  cliente: string;
  oportunidad: string;
  ciudad: CiudadDemo;
  vendedorIdx: number;
  status: Quotation["status"];
  diasCreacion: number; // negative = past
  puestos: PuestoCotizado[];
  margen: number;
}

function buildQuotations(
  catalogItems: CatalogItem[]
): { quotations: Quotation[]; exceptions: ValidationException[]; auditExtra: AuditLogEntry[] } {
  const specs: QuotationSeedSpec[] = [
    {
      cliente: "Grupo Industrial del Bajío",
      oportunidad: "Resguardo planta CDMX",
      ciudad: "CDMX",
      vendedorIdx: 0,
      status: "PROPUESTA_GENERADA",
      diasCreacion: -20,
      puestos: [puesto("Guardia Intramuros", 8, 12000), puesto("Supervisor", 1, 17200)],
      margen: 0.28,
    },
    {
      cliente: "Corporativo Reforma 360",
      oportunidad: "Seguridad corporativa torre A",
      ciudad: "CDMX",
      vendedorIdx: 0,
      status: "VALIDADA",
      diasCreacion: -15,
      puestos: [puesto("Guardia Armado", 4, 14200), puesto("Guardia Intramuros", 6, 11800)],
      margen: 0.25,
    },
    {
      cliente: "Parque Industrial Querétaro Norte",
      oportunidad: "Ronda perimetral y acceso",
      ciudad: "Querétaro",
      vendedorIdx: 1,
      // Deliberately out of range salary → creates an exception
      status: "PENDIENTE_VALIDACION",
      diasCreacion: -8,
      puestos: [puesto("Guardia Intramuros", 10, 13000), puesto("Supervisor", 1, 16800)],
      margen: 0.26,
    },
    {
      cliente: "Plaza Comercial Andares",
      oportunidad: "Seguridad centro comercial",
      ciudad: "Guadalajara",
      vendedorIdx: 2,
      status: "PENDIENTE_VALIDACION",
      diasCreacion: -6,
      puestos: [puesto("Guardia Intramuros", 12, 13800, { equipoCosto: 620 }), puesto("Guardia Armado", 2, 13100)],
      margen: 0.27,
    },
    {
      cliente: "Fraccionamiento Los Encinos",
      oportunidad: "Vigilancia residencial",
      ciudad: "Querétaro",
      vendedorIdx: 1,
      status: "CALCULADA",
      diasCreacion: -4,
      puestos: [puesto("Guardia Intramuros", 5, 11200)],
      margen: 0.24,
    },
    {
      cliente: "Terminal Logística del Pacífico",
      oportunidad: "Custodia de patio y báscula",
      ciudad: "Guadalajara",
      vendedorIdx: 2,
      status: "CALCULADA",
      diasCreacion: -3,
      puestos: [
        puesto("Guardia Armado", 3, 14300),
        puesto("Supervisor", 1, 16200),
        puesto("Guardia Intramuros", 4, 11500, { vehiculoOpcional: true, vehiculoCosto: 9800 }),
      ],
      margen: 0.3,
    },
    {
      cliente: "Hospital Santa Fe",
      oportunidad: "Seguridad hospitalaria 24/7",
      ciudad: "CDMX",
      vendedorIdx: 0,
      status: "BORRADOR",
      diasCreacion: -1,
      puestos: [puesto("Guardia Intramuros", 6, 12100)],
      margen: 0.25,
    },
    {
      cliente: "Constructora Vértice",
      oportunidad: "Resguardo obra en construcción",
      ciudad: "Querétaro",
      vendedorIdx: 1,
      status: "CANCELADA",
      diasCreacion: -30,
      puestos: [puesto("Guardia Intramuros", 3, 11000)],
      margen: 0.22,
    },
    {
      cliente: "Torre Corporativa Andrómeda",
      oportunidad: "Recepción y control de acceso",
      ciudad: "CDMX",
      vendedorIdx: 2,
      // Second exception example, armed guard salary above authorized max
      status: "PENDIENTE_VALIDACION",
      diasCreacion: -2,
      puestos: [puesto("Guardia Armado", 2, 15900), puesto("Guardia Intramuros", 3, 11900)],
      margen: 0.26,
    },
    {
      cliente: "Distribuidora del Centro",
      oportunidad: "Vigilancia de bodega y patio de maniobras",
      ciudad: "Guadalajara",
      vendedorIdx: 2,
      status: "VALIDADA",
      diasCreacion: -10,
      puestos: [puesto("Guardia Intramuros", 7, 11900), puesto("Supervisor", 1, 17500)],
      margen: 0.27,
    },
  ];

  const quotations: Quotation[] = [];
  const exceptions: ValidationException[] = [];
  const auditExtra: AuditLogEntry[] = [];

  specs.forEach((spec, idx) => {
    const vendedor = VENDEDORES[spec.vendedorIdx];
    const folio = `PM-2026-${String(idx + 1).padStart(5, "0")}`;
    const resultado = calcularCotizacion(spec.puestos, {
      grossMarginObjetivo: spec.margen,
      vigenciaPropuestaDias: 30,
      observaciones: "",
    });

    const relevantSnapshot = catalogItems.filter(
      (c) => c.catalogType === "SALARIOS" || c.catalogType === "IMPUESTOS" || c.catalogType === "UNIFORMES"
    );

    const quotationId = id("cot");
    const quotation: Quotation = {
      id: quotationId,
      folio,
      datosGenerales: {
        cliente: spec.cliente,
        nombreOportunidad: spec.oportunidad,
        ciudad: spec.ciudad,
        estado: ESTADO_POR_CIUDAD[spec.ciudad],
        fecha: dateOnly(spec.diasCreacion),
        vendedorId: vendedor.id,
        vendedorNombre: vendedor.nombre,
      },
      puestos: spec.puestos,
      parametrosComerciales: {
        grossMarginObjetivo: spec.margen,
        vigenciaPropuestaDias: 30,
        observaciones: spec.status === "BORRADOR" ? "" : "Precios sujetos a validación final de Pricing.",
      },
      resultado: spec.status === "BORRADOR" ? undefined : resultado,
      parametrosSnapshot:
        spec.status === "BORRADOR"
          ? undefined
          : { tomadoEl: isoAt(spec.diasCreacion, 10, 0), items: relevantSnapshot },
      status: spec.status,
      createdAt: isoAt(spec.diasCreacion, 9, 15),
      updatedAt: isoAt(spec.diasCreacion + 1, 11, 0),
      createdBy: vendedor.id,
      exceptionIds: [],
    };

    // Manually curated exceptions for the three PENDIENTE_VALIDACION quotations
    // that were deliberately seeded with an out-of-range salary.
    if (spec.cliente === "Parque Industrial Querétaro Norte") {
      const salCat = catalogItems.find((c) => c.nombre === "Guardia Intramuros" && c.ubicacion === "Querétaro")!;
      const exc = makeException(quotation, "Salario — Guardia Intramuros — Querétaro", 13000, salCat, -8);
      exceptions.push(exc);
      quotation.exceptionIds.push(exc.id);
    }
    if (spec.cliente === "Plaza Comercial Andares") {
      const salCat = catalogItems.find((c) => c.nombre === "Guardia Armado" && c.ubicacion === "Guadalajara")!;
      const exc = makeException(quotation, "Salario — Guardia Armado — Guadalajara", 13100, salCat, -6);
      exceptions.push(exc);
      quotation.exceptionIds.push(exc.id);
    }
    if (spec.cliente === "Torre Corporativa Andrómeda") {
      const salCat = catalogItems.find((c) => c.nombre === "Guardia Armado" && c.ubicacion === "CDMX")!;
      const exc = makeException(quotation, "Salario — Guardia Armado — CDMX", 15900, salCat, -2);
      exceptions.push(exc);
      quotation.exceptionIds.push(exc.id);
    }

    quotations.push(quotation);
  });

  // Two already-resolved exceptions (history), tied to VALIDADA quotations.
  const validada1 = quotations.find((q) => q.datosGenerales.cliente === "Corporativo Reforma 360")!;
  const salCatCdmxArmado = catalogItems.find((c) => c.nombre === "Guardia Armado" && c.ubicacion === "CDMX")!;
  const resolved1 = makeException(validada1, "Salario — Guardia Armado — CDMX", 15200, salCatCdmxArmado, -15);
  resolved1.status = "ACEPTADA";
  resolved1.comentarioResolucion = "Cliente estratégico; se autoriza como caso excepcional para este contrato.";
  resolved1.resueltoPor = "Laura Sánchez";
  resolved1.resueltoEn = isoAt(-13, 16, 0);
  exceptions.push(resolved1);
  validada1.exceptionIds.push(resolved1.id);

  const validada2 = quotations.find((q) => q.datosGenerales.cliente === "Distribuidora del Centro")!;
  const salCatGdlSup = catalogItems.find((c) => c.nombre === "Supervisor" && c.ubicacion === "Guadalajara")!;
  const resolved2 = makeException(validada2, "Salario — Supervisor — Guadalajara", 17500, salCatGdlSup, -10);
  resolved2.diferenciaAbsoluta = 0;
  resolved2.diferenciaPorcentual = 0;
  resolved2.status = "RECHAZADA";
  resolved2.comentarioResolucion = "Dentro de rango tras revisión manual; se descarta la excepción.";
  resolved2.resueltoPor = "Laura Sánchez";
  resolved2.resueltoEn = isoAt(-9, 9, 0);
  exceptions.push(resolved2);

  auditExtra.push({
    id: id("aud"),
    entidad: "EXCEPCION",
    entidadId: resolved1.id,
    descripcion: `Excepción aceptada en cotización ${validada1.folio} (${validada1.datosGenerales.cliente})`,
    usuario: "Laura Sánchez",
    fecha: resolved1.resueltoEn!,
    comentario: resolved1.comentarioResolucion,
  });

  return { quotations, exceptions, auditExtra };
}

function makeException(
  quotation: Quotation,
  campo: string,
  valorCapturado: number,
  catalogItem: CatalogItem,
  diasCreacion: number
): ValidationException {
  const min = catalogItem.valorMin ?? 0;
  const max = catalogItem.valorMax ?? 0;
  const mid = (min + max) / 2;
  return {
    id: id("exc"),
    quotationId: quotation.id,
    quotationFolio: quotation.folio,
    clienteNombre: quotation.datosGenerales.cliente,
    vendedorNombre: quotation.datosGenerales.vendedorNombre,
    campo,
    valorCapturado,
    valorEsperadoMin: min,
    valorEsperadoMax: max,
    diferenciaAbsoluta: Math.round((valorCapturado - mid) * 100) / 100,
    diferenciaPorcentual: mid !== 0 ? Math.round(((valorCapturado - mid) / mid) * 10000) / 10000 : 0,
    fecha: isoAt(diasCreacion, 9, 20),
    status: "PENDIENTE",
    relatedCatalogItemId: catalogItem.id,
  };
}

// ---- Notifications & audit -------------------------------------------------

function buildAuditLog(admin: User, pricing1: User, salarioQroId: string, sedanId: string): AuditLogEntry[] {
  return [
    {
      id: id("aud"),
      entidad: "USUARIO",
      entidadId: "u-pricing-2",
      descripcion: "Se creó el usuario Miguel Torres con rol Pricing",
      usuario: admin.fullName,
      fecha: isoAt(-190, 9, 0),
    },
    {
      id: id("aud"),
      entidad: "PERMISO",
      entidadId: "u-pricing-2",
      descripcion: "Se asignaron permisos: editar uniformes, vehículos y equipamiento; resolver excepciones",
      usuario: admin.fullName,
      fecha: isoAt(-189, 10, 0),
    },
    {
      id: id("aud"),
      entidad: "CATALOGO",
      entidadId: salarioQroId,
      descripcion: "Se actualizó Guardia Intramuros (SALARIOS) — Querétaro",
      valorAnterior: "valorMax: 11500",
      valorNuevo: "valorMax: 12000",
      usuario: "Jorge Martinez",
      fecha: isoAt(-6, 9, 27),
      comentario: "Actualización benchmark septiembre",
    },
    {
      id: id("aud"),
      entidad: "PARAMETRO",
      entidadId: "config-global",
      descripcion: "Se ajustó el días de anticipación de alerta por defecto a 30 días",
      valorAnterior: "15",
      valorNuevo: "30",
      usuario: admin.fullName,
      fecha: isoAt(-100, 12, 0),
    },
    {
      id: id("aud"),
      entidad: "CATALOGO",
      entidadId: sedanId,
      descripcion: "Vehículo Sedán de Ronda marcado como vencido — pendiente renovación con arrendadora",
      usuario: pricing1.fullName,
      fecha: isoAt(-12, 8, 0),
    },
  ];
}

function buildNotifications(): NotificationItem[] {
  return [
    {
      id: id("notif"),
      title: "Catálogo próximo a vencer",
      message: "El catálogo Uniforme Guardia Intramuros - Nacional vencerá pronto.",
      severity: "warning",
      createdAt: isoAt(-1, 8, 0),
      read: false,
      channel: "in_app",
    },
    {
      id: id("notif"),
      title: "Catálogo vencido",
      message: "El catálogo Vehículo Sedán de Ronda - Nacional está vencido.",
      severity: "critical",
      createdAt: isoAt(-2, 8, 0),
      read: false,
      channel: "in_app",
    },
  ];
}

// ---- Public entry point ----------------------------------------------------

export interface SeedData {
  users: User[];
  catalogItems: CatalogItem[];
  catalogHistory: CatalogHistoryEntry[];
  notifications: NotificationItem[];
  quotations: Quotation[];
  exceptions: ValidationException[];
  auditLog: AuditLogEntry[];
  benchmark: BenchmarkEntry[];
  globalConfig: GlobalConfig;
}

export function buildSeedData(): SeedData {
  idCounter = 0;
  const users = buildUsers();
  const admin = users.find((u) => u.role === "ADMIN_FUNCIONAL")!;
  const pricing1 = users.find((u) => u.id === "u-pricing-1")!;

  const {
    items: catalogItems,
    history: catalogHistory,
    salarioQroId,
    sedanId,
  } = buildCatalogItems(admin);
  const benchmark = buildBenchmark();
  const { quotations, exceptions, auditExtra } = buildQuotations(catalogItems);
  const auditLog = [...buildAuditLog(admin, pricing1, salarioQroId, sedanId), ...auditExtra];
  const notifications = buildNotifications();

  const globalConfig: GlobalConfig = {
    ultimaActualizacionModelo: isoAt(-1, 9, 30),
    defaultDiasAnticipacionAlerta: 30,
  };

  return {
    users,
    catalogItems,
    catalogHistory,
    notifications,
    quotations,
    exceptions,
    auditLog,
    benchmark,
    globalConfig,
  };
}

export type { CatalogType };
