import { Link } from "@tanstack/react-router";
import { AtheriaMark } from "./atheria-mark";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-[var(--surface)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <AtheriaMark />
          <p className="text-xs text-muted-foreground">
            Sistemas de gestión que crecen con tu organización.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
          <Link to="/funcionalidades" className="hover:text-foreground">
            Funcionalidades
          </Link>
          <Link to="/casos" className="hover:text-foreground">
            Casos
          </Link>
          <Link to="/precios" className="hover:text-foreground">
            Precios
          </Link>
          <Link to="/contacto" className="hover:text-foreground">
            Contacto
          </Link>
          <Link to="/acceder" className="hover:text-foreground">
            Acceder
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Atheria · Cooperativas, primer sistema disponible.
        </p>
      </div>
    </footer>
  );
}