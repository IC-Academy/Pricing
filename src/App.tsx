import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ensureSeeded } from "./data/db";
import { AuthProvider, useAuth } from "./modules/auth/AuthContext";
import { ToastProvider } from "./state/ToastContext";
import { AppShell } from "./ui/layout/AppShell";
import { RequireAuth, RequireSection } from "./ui/layout/RequireAuth";
import { LoginPage } from "./ui/pages/login/LoginPage";
import { DashboardPage } from "./ui/pages/dashboard/DashboardPage";
import { CatalogosPage } from "./ui/pages/catalogos/CatalogosPage";
import { BenchmarkPage } from "./ui/pages/benchmark/BenchmarkPage";
import { CotizacionesPage } from "./ui/pages/cotizaciones/CotizacionesPage";
import { MisCotizacionesPage } from "./ui/pages/cotizaciones/MisCotizacionesPage";
import { CotizacionDetailPage } from "./ui/pages/cotizaciones/CotizacionDetailPage";
import { PropuestaPage } from "./ui/pages/cotizaciones/PropuestaPage";
import { CalculadoraWizard } from "./ui/pages/calculadora/CalculadoraWizard";
import { ValidacionesPage } from "./ui/pages/validaciones/ValidacionesPage";
import { UsuariosPage } from "./ui/pages/usuarios/UsuariosPage";
import { AuditoriaPage } from "./ui/pages/auditoria/AuditoriaPage";
import { ConfiguracionPage } from "./ui/pages/configuracion/ConfiguracionPage";

function RootRedirect() {
  const { currentUser } = useAuth();
  return <Navigate to={currentUser ? "/dashboard" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<RequireSection section="dashboard"><DashboardPage /></RequireSection>} />
        <Route path="/catalogos" element={<RequireSection section="catalogos"><CatalogosPage /></RequireSection>} />
        <Route path="/benchmark" element={<RequireSection section="benchmark"><BenchmarkPage /></RequireSection>} />
        <Route path="/cotizaciones" element={<RequireSection section="cotizaciones"><CotizacionesPage /></RequireSection>} />
        <Route path="/cotizaciones/:id" element={<CotizacionDetailPage />} />
        <Route path="/propuesta/:id" element={<PropuestaPage />} />
        <Route path="/nueva-cotizacion" element={<RequireSection section="nuevaCotizacion"><CalculadoraWizard /></RequireSection>} />
        <Route path="/mis-cotizaciones" element={<RequireSection section="misCotizaciones"><MisCotizacionesPage /></RequireSection>} />
        <Route path="/validaciones" element={<RequireSection section="validaciones"><ValidacionesPage /></RequireSection>} />
        <Route path="/usuarios" element={<RequireSection section="usuarios"><UsuariosPage /></RequireSection>} />
        <Route path="/auditoria" element={<RequireSection section="auditoria"><AuditoriaPage /></RequireSection>} />
        <Route path="/configuracion" element={<RequireSection section="configuracion"><ConfiguracionPage /></RequireSection>} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-ink-50 px-4 text-center">
      <p className="text-4xl">🧭</p>
      <h1 className="text-lg font-semibold text-ink-900">Página no encontrada</h1>
      <p className="text-sm text-ink-500">La ruta que buscas no existe en Price Model 365.</p>
      <a href="/" className="mt-2 text-sm font-medium text-brand-600 hover:underline">
        Volver al inicio
      </a>
    </div>
  );
}

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureSeeded();
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
