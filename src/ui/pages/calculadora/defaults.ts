import { findApplicableCatalogItem, listCatalogItems } from "../../../modules/catalog-service";
import type { CiudadDemo, PerfilPuesto } from "../../../types";

export function defaultSalario(perfil: PerfilPuesto, ciudad: CiudadDemo): number {
  const item = findApplicableCatalogItem("SALARIOS", perfil, ciudad);
  return item ? item.valor : 12000;
}

export function defaultUniforme(perfil: PerfilPuesto): number {
  const item = listCatalogItems("UNIFORMES").find((i) => i.nombre.toLowerCase().includes(perfil.toLowerCase()) && i.activo);
  return item ? item.valor : 350;
}

export function defaultEquipo(): number {
  const items = listCatalogItems("EQUIPAMIENTO").filter((i) => i.activo);
  return items.reduce((acc, i) => acc + i.valor, 0);
}

export function defaultVehiculo(): number {
  const item = listCatalogItems("VEHICULOS").find((i) => i.activo);
  return item ? item.valor : 9800;
}
