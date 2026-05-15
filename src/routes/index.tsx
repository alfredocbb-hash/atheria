import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Building2, FileText, Wrench, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coopecur 2.0 — Tu cooperativa de servicios" },
      {
        name: "description",
        content:
          "Acceda a su estado de cuenta, facturas y reclamos técnicos de Coopecur desde un solo lugar.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const auth = useAuth();

  if (auth.isAuthenticated) {
    return (
      <Navigate to={auth.isAdminOrOperator ? "/admin" : "/cliente"} replace />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Coopecur 2.0</p>
              <p className="text-xs text-muted-foreground">
                Cooperativa de Servicios Públicos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Registrarme</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
              Oficina Virtual
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Gestione sus servicios desde un solo lugar
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              Consulte facturas, registre reclamos técnicos y dé seguimiento a sus
              suministros de manera simple, segura y transparente.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/login">Acceder a mi cuenta</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/register">Soy nuevo socio</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FeatureCard icon={<FileText className="h-5 w-5" />} title="Facturación" text="Historial de consumos y estado de cuenta al día." />
            <FeatureCard icon={<Wrench className="h-5 w-5" />} title="Reclamos" text="Reporte cortes, fugas o fallas de medidor." />
            <FeatureCard icon={<Building2 className="h-5 w-5" />} title="Suministros" text="Información de cada uno de sus medidores." />
            <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Seguro" text="Acceso protegido por autenticación institucional." />
          </div>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Coopecur — Cooperativa de Servicios Públicos.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
