import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../modules/auth/AuthContext";
import { ROLES } from "../../../modules/auth/roles";
import { Card } from "../../components/Card";

export function LoginPage() {
  const { allUsers, loginAs } = useAuth();
  const navigate = useNavigate();

  const groups: { role: string; users: typeof allUsers }[] = [
    { role: "SUPERADMIN", users: allUsers.filter((u) => u.role === "SUPERADMIN") },
    { role: "ADMIN_FUNCIONAL", users: allUsers.filter((u) => u.role === "ADMIN_FUNCIONAL") },
    { role: "PRICING", users: allUsers.filter((u) => u.role === "PRICING") },
    { role: "VENTAS", users: allUsers.filter((u) => u.role === "VENTAS") },
  ];

  function handleLogin(userId: string) {
    loginAs(userId);
    navigate("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
            PM
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Price Model 365</h1>
          <p className="mt-1 text-sm text-ink-500">Demo funcional · Inter-Con EDD Pricing</p>
        </div>

        <Card className="p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink-500">
            Selecciona un usuario demo para iniciar sesión
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <div key={group.role} className="rounded-md border border-ink-200 p-3">
                <p className="mb-2 text-xs font-semibold text-brand-700">
                  {ROLES[group.role as keyof typeof ROLES].label}
                </p>
                <div className="space-y-1.5">
                  {group.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleLogin(u.id)}
                      className="flex w-full flex-col items-start rounded-md border border-ink-200 px-3 py-2 text-left text-sm hover:border-brand-400 hover:bg-brand-50"
                    >
                      <span className="font-medium text-ink-900">{u.fullName}</span>
                      {u.cargo && <span className="text-xs text-ink-500">{u.cargo}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <p className="mt-4 text-center text-xs text-ink-400">
          Esta es una demo con datos locales — sin credenciales reales.
        </p>
      </div>
    </div>
  );
}
