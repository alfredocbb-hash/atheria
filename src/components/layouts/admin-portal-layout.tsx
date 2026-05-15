import { Link } from "@tanstack/react-router";
import { Building2, LayoutDashboard, LogOut, Receipt, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, enabled: true, active: true },
  { label: "Padrones", icon: Users, enabled: false },
  { label: "Facturación", icon: Receipt, enabled: false },
  { label: "Despacho", icon: Wrench, enabled: false },
];

export function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return (
    <div className="flex min-h-screen bg-secondary/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Coopecur 2.0</p>
            <p className="text-[11px] text-sidebar-foreground/70">Backoffice</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const base = "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors";
            if (!item.enabled) {
              return (
                <span key={item.label} className={cn(base, "cursor-not-allowed text-sidebar-foreground/40")} title="Disponible en próximas fases">
                  <Icon className="h-4 w-4" />{item.label}
                </span>
              );
            }
            return (
              <Link key={item.label} to="/admin" className={cn(base, item.active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
                <Icon className="h-4 w-4" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="px-2 pb-2 text-[11px] text-sidebar-foreground/60">{auth.user?.email}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => auth.signOut()}>
            <LogOut className="mr-2 h-4 w-4" />Cerrar sesión
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-6 py-3 md:hidden">
          <Link to="/admin" className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">Coopecur 2.0</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => auth.signOut()}><LogOut className="h-4 w-4" /></Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
