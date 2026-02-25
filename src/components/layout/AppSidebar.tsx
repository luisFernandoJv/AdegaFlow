import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Settings,
  Wine,
  Moon,
  Sun,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "PDV", href: "/pdv", icon: ShoppingCart },
  { name: "Produtos", href: "/produtos", icon: Package },
  { name: "Despesas", href: "/despesas", icon: Receipt },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useApp();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Wine className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-sidebar-foreground">
            Adega
          </span>
          <span className="text-xs text-muted-foreground">
            Sistema de Gestão
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive && "text-primary-foreground")}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={toggleTheme}
        >
          {theme === "light" ? (
            <>
              <Moon className="h-5 w-5" />
              <span>Modo Escuro</span>
            </>
          ) : (
            <>
              <Sun className="h-5 w-5" />
              <span>Modo Claro</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
