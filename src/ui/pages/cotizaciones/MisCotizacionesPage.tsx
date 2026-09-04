import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { listQuotationsByVendedor } from "../../../modules/quotation-service";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { CotizacionesTable } from "./CotizacionesTable";

export function MisCotizacionesPage() {
  const { currentUser } = useAuth();
  const [refreshKey] = useState(0);

  const quotations = useMemo(() => {
    if (!currentUser) return [];
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshKey;
    return listQuotationsByVendedor(currentUser.id);
  }, [currentUser, refreshKey]);

  if (!currentUser) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Mis Cotizaciones</h2>
          <p className="text-sm text-ink-500">Cotizaciones que has generado, {currentUser.fullName.split(" ")[0]}.</p>
        </div>
        <Link to="/nueva-cotizacion">
          <Button>+ Nueva cotización</Button>
        </Link>
      </div>

      <Card>
        <CotizacionesTable quotations={quotations} />
      </Card>
    </div>
  );
}
