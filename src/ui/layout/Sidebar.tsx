import { NavLink } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { navSectionsForRole, ROLES } from "../../modules/auth/roles";
import { NAV_ITEMS } from "./nav";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const allowed = new Set(navSectionsForRole(currentUser.role));
  const items = NAV_ITEMS.filter((item) => allowed.has(item.section));

  return (
    <div className="flex h-full flex-col bg-ink-900 text-ink-100">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-sm font-bold text-white">
          PM
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Price Model 365</p>
          <p className="text-[11px] text-ink-400">Inter-Con · Pricing</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {items.map((item) => (
          <NavLink
            key={item.section}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-brand-600 text-white" : "text-ink-300 hover:bg-ink-800 hover:text-white"
              }`
            }
          >
            <span className="w-4 text-center text-[13px]">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-800 px-4 py-4">
        <p className="text-xs font-medium text-white">{currentUser.fullName}</p>
        <p className="text-[11px] text-ink-400">{ROLES[currentUser.role].label}</p>
      </div>
    </div>
  );
}
