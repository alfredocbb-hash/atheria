import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import {
  Users,
  Gauge,
  FileText,
  Wrench,
  CreditCard,
  Globe,
} from "lucide-react";

const MODULES = [
  {
    icon: Users,
    title: "Socios y suministros",
    description:
      "Padrón centralizado con legajos digitales, vinculación de suministros y portal de autogestión.",
    bullets: [
      "Importación masiva de socios desde planillas",
      "Estados: alta, baja, suspendido, en gestión",
      "Direcciones de suministro con coordenadas",
    ],
  },
  {
    icon: Gauge,
    title: "Lecturas de medidores",
    description:
      "Carga de estados de medidores manual o en lote, con detección automática de consumos atípicos.",
    bullets: [
      "Hoja de ruta del lecturista por zona",
      "Validación contra promedios históricos",
      "Importación CSV y cambio de medidor",
    ],
  },
  {
    icon: FileText,
    title: "Facturación masiva",
    description:
      "Generación de facturas en lote por período con cálculo de tarifa fija + consumo y numeración correlativa.",
    bullets: [
      "Tarifas vigentes con histórico",
      "Preview antes de facturar",
      "Notas y observaciones por factura",
    ],
  },
  {
    icon: Wrench,
    title: "Reclamos y cuadrillas",
    description:
      "Gestión de tickets técnicos con asignación a cuadrillas, órdenes de trabajo y notificaciones al socio.",
    bullets: [
      "Categorías y prioridades configurables",
      "Comentarios internos y públicos",
      "Historial completo por suministro",
    ],
  },
  {
    icon: CreditCard,
    title: "Cobranzas",
    description:
      "Tablero de cobranza con tramos de morosidad, registro manual de pagos y conciliación.",
    bullets: [
      "Estado de cuenta por socio",
      "Métodos: efectivo, transferencia, débito",
      "Reportes de recaudación por período",
    ],
  },
  {
    icon: Globe,
    title: "Portal del socio",
    description:
      "Oficina virtual donde el socio consulta sus facturas, reclama y ve el estado de sus trámites.",
    bullets: [
      "Notificaciones en tiempo real",
      "Descarga de facturas",
      "Carga de reclamos desde celular",
    ],
  },
];

export const Route = createFileRoute("/funcionalidades")({
  head: () => ({
    meta: [
      { title: "Funcionalidades — Atheria" },
      {
        name: "description",
        content:
          "Seis módulos integrados para gestionar tu cooperativa: socios, lecturas, facturación, reclamos, cobranzas y portal del socio.",
      },
      { property: "og:title", content: "Funcionalidades — Atheria" },
      {
        property: "og:description",
        content:
          "Todo lo que necesita una cooperativa de servicios para digitalizar su operación.",
      },
      { property: "og:url", content: "/funcionalidades" },
    ],
    links: [{ rel: "canonical", href: "/funcionalidades" }],
  }),
  component: FuncionalidadesPage,
});

function FuncionalidadesPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <section className="bg-[var(--surface)] py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--brand-teal)]">
              Sistema para cooperativas
            </p>
            <h1
              className="text-4xl font-bold leading-tight tracking-tight md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Todo lo que tu cooperativa necesita en una sola plataforma
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Seis módulos pensados para reemplazar Excel, papel y sistemas
              fragmentados con un flujo único de trabajo.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <article
                key={m.title}
                className="rounded-2xl border border-border bg-card p-8 transition-colors hover:border-[var(--brand-teal)]"
              >
                <div
                  className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{
                    background: "color-mix(in oklab, var(--brand-teal) 10%, transparent)",
                    color: "var(--brand-teal)",
                  }}
                >
                  <m.icon className="h-6 w-6" />
                </div>
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {m.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {m.description}
                </p>
                <ul className="mt-5 space-y-2 text-sm text-foreground">
                  {m.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--brand-teal)" }}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[var(--brand-deep)] py-20 text-white">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
            <h2
              className="text-3xl font-bold md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Listo para verlo en acción
            </h2>
            <p className="text-white/70">
              Probá Atheria gratis durante 14 días, sin tarjeta de crédito.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[var(--brand-teal)] text-white hover:bg-[var(--brand-teal)]/90"
              >
                <Link to="/register">Probar gratis</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Link to="/contacto">Agendar demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}