import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Coopecur 2.0</p>
              <p className="text-xs text-muted-foreground">Oficina Virtual</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
            <div className="mt-6">{children}</div>
          </div>
          {footer && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {footer}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}