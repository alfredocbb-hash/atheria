import { Link } from "@tanstack/react-router";
import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/cliente" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Coopecur 2.0</p>
              <p className="text-[11px] text-muted-foreground">Oficina Virtual</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground md:inline">{auth.user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => auth.signOut()}>
              <LogOut className="mr-2 h-4 w-4" />Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
