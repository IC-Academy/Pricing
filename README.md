# Price Model 365 — Demo funcional

Demo funcional y navegable de **Price Model 365**, la futura plataforma de pricing de Inter-Con para el proceso de
EDD (Evaluación de Desempeño... perdón, en este contexto: *Estimación De Demanda/cotización*) de seguridad privada.

Esta primera versión valida **arquitectura, experiencia de usuario, roles, catálogos, excepciones y el flujo de
cotización completo** — no las fórmulas reales de Excel, que se sustituyen en un solo módulo aislado
(`pricing-engine`, ver más abajo).

Flujo completo demostrable: **Venta → Cotización → Detección de excepción → Revisión por Pricing → Propuesta
preliminar.**

---

## 1. Cómo ejecutar la demo

Requiere Node.js 18+ (se probó con Node 22).

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto `http://localhost:5173`). La primera vez que carga, la app siembra
automáticamente el set de datos demo en `localStorage` — no se necesita backend ni base de datos.

Otros comandos útiles:

```bash
npm run build     # compila TypeScript y genera el build de producción en dist/
npm run preview   # sirve el build de producción localmente
npm run test      # corre la suite de pruebas automatizadas (Vitest)
npm run test:watch
```

La demo es 100% front-end: toda la información vive en el `localStorage` del navegador. Cerrar sesión, cambiar de
usuario o refrescar la página **no borra los datos**. Para volver al set de datos original, usa **Configuración →
Restablecer datos demo** dentro de la app (visible para Superadmin y Admin Funcional).

---

## 2. Usuarios demo

No hay contraseñas: la pantalla de login permite elegir cualquiera de estos usuarios, y también se puede cambiar de
usuario en cualquier momento desde el menú superior derecho (útil para demostrar varios roles sin cerrar sesión).

| Usuario | Rol | Notas |
|---|---|---|
| **Jorge Mejía** | Superadmin Técnico | Acceso total, incluida configuración global. |
| **Jorge Martinez** | Administrador Funcional (Coordinador de Precios y Admon de Contratos) | Administra usuarios, catálogos, vigencias, alertas y excepciones. |
| **Laura Sánchez** | Pricing | Permisos: editar Salarios e Impuestos, resolver excepciones, consultar auditoría. |
| **Miguel Torres** | Pricing | Permisos: editar Uniformes, Vehículos y Equipamiento, resolver excepciones. |
| **Ana Ruiz** | Ventas | Crea cotizaciones, usa la calculadora, genera propuestas. |
| **Carlos Vega** | Ventas | Igual que Ana Ruiz. |
| **Sofía Ramírez** | Ventas | Igual que Ana Ruiz. |

Los permisos de los usuarios Pricing son configurables por el Admin desde **Usuarios**.

---

## 3. Qué se puede demostrar

1. **Iniciar sesión como Ana Ruiz (Ventas)** → *Nueva Cotización* → captura un cliente, agrega uno o más puestos
   (Guardia Intramuros / Armado / Supervisor) y parámetros comerciales → *Calcular cotización*.
2. Si el salario capturado para un puesto/ciudad queda **fuera del rango autorizado** en el catálogo de Salarios,
   la cotización **no se bloquea**: se calcula igual, se marca `Pendiente de validación` y se crea automáticamente
   una excepción para Pricing (con valor capturado, rango autorizado y diferencias absoluta/porcentual).
3. **Cambiar a Laura Sánchez (Pricing)** desde el menú de usuario → *Centro de Validaciones* → revisar la excepción:
   aceptar (con comentario obligatorio), rechazar, solicitar ajuste o convertirla en el nuevo parámetro autorizado
   (esto último amplía automáticamente el rango en el catálogo de Salarios).
4. Volver a la cotización → una vez sin excepciones pendientes, **Generar propuesta** → vista imprimible con
   disclaimer legal, lista para PDF/impresión (`Ctrl/Cmd+P`).
5. **Catálogos**: crear/editar/desactivar registros de Salarios, Impuestos, Uniformes, Vehículos y Equipamiento;
   cada registro guarda su propio historial de cambios.
6. **Dashboard**: tarjetas de catálogos vigentes/próximos a vencer/vencidos, validaciones pendientes, cotizaciones
   del mes, y la sección "Salud del Price Model" con semáforo por categoría (incluido Benchmark).
7. **Centro de notificaciones** (icono de campana): alertas generadas automáticamente cuando un catálogo entra en su
   ventana de aviso o vence.
8. **Auditoría**: cambios en catálogos, parámetros, usuarios, permisos y excepciones, con valor anterior/nuevo,
   usuario y comentario.
9. **Snapshot de parámetros**: cambia un salario en Catálogos y abre una cotización anterior — el precio mostrado
   **no cambia**, porque cada cotización calculada congela una copia de los catálogos usados en ese momento.
10. **Restricciones por rol**: iniciar sesión como Ventas e intentar navegar manualmente a `/configuracion`,
    `/catalogos`, `/usuarios` o `/auditoria` — la app bloquea el acceso aunque se teclee la URL directamente.

---

## 4. Arquitectura

Proyecto **Vite + React 19 + TypeScript + React Router + Tailwind CSS v4**, organizado para que la lógica de negocio
nunca viva dentro de un componente visual:

```
src/
  types/                  Contratos de dominio compartidos (User, CatalogItem, Quotation, etc.)
  lib/                    Utilidades puras: storage, ids/formato, cálculo de vigencia
  data/
    db.ts                 Fachada única de acceso a datos (repositorios + seed + reset)
    seed.ts               Generador de datos demo (usuarios, catálogos, cotizaciones, excepciones, auditoría)
  modules/
    auth/                 Roles, matriz de permisos, contexto de sesión (AuthContext)
    pricing-engine/       ⭐ Motor de cálculo — ÚNICO lugar con las fórmulas de costo/precio
    validation-engine/    Validación de valores contra catálogos + ciclo de vida de excepciones
    catalog-service/      CRUD de catálogos, cómputo de vigencia, historial de cambios
    notification-service/ Motor de alertas de vigencia + centro de notificaciones in-app
    audit-service/        Registro único de auditoría (todas las mutaciones pasan por aquí)
    quotation-service/    Orquesta creación de cotizaciones (pricing-engine + validation-engine + snapshot + folio)
  ui/
    layout/                AppShell, Sidebar, Topbar, guardas de ruta (RequireAuth / RequireSection)
    components/             Componentes visuales reutilizables (Button, Card, Drawer, badges…)
    pages/                   Una carpeta por pantalla (dashboard, catalogos, cotizaciones, calculadora,
                             validaciones, usuarios, auditoria, configuracion, benchmark, login)
```

Reglas de diseño que se respetaron a propósito:

- **Ningún componente de UI calcula precios ni valida rangos directamente.** Todo pasa por `pricing-engine` y
  `validation-engine`.
- **Toda mutación de catálogos, parámetros, usuarios, permisos o excepciones pasa por `audit-service`**, así que la
  pantalla de Auditoría siempre refleja la realidad sin lógica duplicada.
- **La capa de datos es una interfaz (`Repository<T>`), no `localStorage` directo.** Hoy la única implementación es
  `LocalStorageRepository` (ver `src/lib/storage.ts`); para cambiar a una API real, SQL o Microsoft 365/Dataverse
  más adelante basta con escribir una nueva clase que cumpla esa misma interfaz y reemplazar las instancias en
  `src/data/db.ts` — nada en la UI ni en los motores de negocio necesita cambiar.
- **Permisos centralizados** en `src/modules/auth/roles.ts`: toda pantalla y toda ruta consulta funciones como
  `canAccessSection`, `canEditCatalog`, `canResolveExceptions`, nunca comparaciones de rol dispersas.

### Dónde sustituir las fórmulas reales de Excel

Todo el cálculo demo vive en **`src/modules/pricing-engine/index.ts`**, con un comentario al inicio del archivo que
lo marca explícitamente. La fórmula actual es una simplificación:

```
costoLaboralMensual = salario × (1 + cargaSocial%)
costoMensualTotal    = (costoLaboralMensual + uniforme + equipo + vehículo) × (1 + overhead%)
precioRecomendado    = costoMensualTotal / (1 − margenObjetivo)
```

Para integrar las reglas reales del Excel: implementar una función con la misma firma que `calcularCotizacion`
(mismo tipo de entrada `PuestoCotizado[]` + `ParametrosComerciales`, mismo tipo de salida `ResultadoCalculo`),
sustituir su uso en `quotation-service` y `ui/pages/calculadora`, y eliminar las constantes de ejemplo
(`CARGA_SOCIAL_PCT`, `OVERHEAD_PCT`). Ningún otro archivo necesita tocarse.

De forma similar, `validation-engine/index.ts` es el único lugar que decide qué es "fuera de rango" — hoy sólo
valida salario contra el catálogo de Salarios; ahí mismo se agregarían validaciones adicionales (uniforme, equipo,
vehículo) cuando se definan sus reglas reales.

---

## 5. Persistencia y datos demo

- Todo se guarda en `localStorage` bajo llaves con prefijo `pm365:`. No hay backend.
- El primer arranque siembra automáticamente ~7 usuarios, 20+ registros de catálogo (con vigencias vencidas,
  próximas a vencer y vigentes a propósito), 10 cotizaciones en distintos estados, ~5 excepciones (algunas ya
  resueltas) y un historial de auditoría.
- **Configuración → Restablecer datos demo** borra todo y vuelve a sembrar el set original — usar antes de cada
  demo en vivo si se quiere partir de un estado limpio.

---

## 6. Pruebas automatizadas

```bash
npm run test
```

Cubre lo mínimo crítico para no romper la demo en un refactor:

- **`pricing-engine`**: carga social, overhead, inclusión/exclusión de vehículo opcional, fórmula precio = costo /
  (1 − margen), clamp de márgenes inválidos, agregación de totales multi-puesto.
- **`validation-engine`**: detección de valores dentro/fuera de rango (por arriba y por debajo), que la validación
  nunca "bloquea" (sólo reporta hallazgos), creación de excepciones, aceptación con comentario, y conversión de una
  excepción en nuevo parámetro (verificando que el catálogo se actualiza y que el mismo valor deja de generar una
  excepción después).
- **`auth/roles`**: matriz de navegación por rol (Ventas nunca ve Configuración/Catálogos/Usuarios/Auditoría),
  permisos de edición de catálogo configurables por usuario Pricing, quién puede resolver excepciones, ver
  auditoría, administrar usuarios o crear cotizaciones.

Además del flujo completo se validó manualmente end-to-end con un script de navegador (login por rol, restricciones
de ruta por URL directa, creación de cotización con excepción automática, resolución de la excepción, generación de
propuesta, reseteo de datos demo y persistencia tras el reset) antes de entregar esta demo.

---

## 7. Limitaciones conocidas de esta primera versión (a propósito)

- Las fórmulas de costo/precio son una simplificación demostrativa, no las reglas reales de Excel (ver sección 4).
- Las notificaciones sólo se entregan dentro de la app (`channel: "in_app"`); el tipo de dato ya contempla
  `"outlook"` y `"teams"` para cuando se conecte un canal real, pero no hay integración todavía.
- No hay backend ni autenticación real — es intencional para esta fase de validación de arquitectura/UX.
- El folio de cotización (`PM-2026-00001`) se genera contando registros existentes; en un backend real se
  reemplazaría por un contador atómico del servidor.
