import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AtheriaMark } from "./atheria-mark";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/funcionalidades", label: "Funcionalidades" },
  { to: "/casos", label: "Casos" },
  { to: "/precios", label: "Precios" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function MarketingHeader() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link to="/" className="shrink-0">
            <AtheriaMark />
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="transition-colors hover:text-[var(--brand-teal)]"
                activeProps={{ className: "text-[var(--brand-deep)] font-semibold" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {auth.isAuthenticated && auth.rolesLoaded ? (
            <Button asChild size="sm">
              <Link to={auth.isAdminOrOperator ? "/admin" : "/cliente"}>
                Volver a mi panel
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/acceder">Acceder</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-[var(--brand-deep)] text-white hover:bg-[var(--brand-deep)]/90"
              >
                <Link to="/register">Probar gratis</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-border md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {auth.isAuthenticated && auth.rolesLoaded ? (
              <Button asChild>
                <Link to={auth.isAdminOrOperator ? "/admin" : "/cliente"}>
                  Volver a mi panel
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to="/acceder">Acceder a mi cooperativa</Link>
                </Button>
                <Button
                  asChild
                  className="bg-[var(--brand-deep)] text-white hover:bg-[var(--brand-deep)]/90"
                >
                  <Link to="/register">Probar gratis 14 días</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}