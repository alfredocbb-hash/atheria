import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Droplets, Zap, Flame, Wifi } from "lucide-react";

const CASES = [
  {
    icon: Droplets,
    title: "Cooperativas de agua",
    description:
      "Lectura de medidores domiciliarios, facturación por consumo, reclamos por roturas y cortes programados.",
    typical: "500 a 5.000 socios · 1-3 zonas de lectura",
  },
  {
    icon: Zap,
    title: "Cooperativas eléctricas",
    description:
      "Tarifas residenciales y comerciales, atención de cuadrillas, reclamos por baja tensión y cortes.",
    typical: "1.000 a 10.000 socios · varias categorías tarifarias",
  },
  {
    icon: Flame,
    title: "Cooperativas de gas",
    description:
      "Lectura periódica, ajustes por temperatura, gestión de pólizas y reclamos por fugas.",
    typical: "Cobertura urbana y periurbana",
  },
  {
    icon: Wifi,
    title: "Cooperativas de internet rural",
    description:
      "Planes mensuales, alta de servicio, soporte técnico y monitoreo de enlaces.",
    typical: "Servicios fijos · sin medidor físico",
  },
];

export const Route = createFileRoute("/casos")({
  head: () => ({
    meta: [
      { title: "Casos de uso — Atheria" },
      {
        name: "description",
        content:
          "Cooperativas de agua, electricidad, gas e internet rural usan Atheria para gestionar su operación.",
      },
      { property: "og:title", content: "Casos de uso — Atheria" },
      {
        property: "og:description",
        content:
          "Cómo se usa la plataforma en cada tipo de servicio público cooperativo.",
      },
      { property: "og:url", content: "/casos" },
    ],
    links: [{ rel: "canonical", href: "/casos" }],
  }),
  component: CasosPage,
});

function CasosPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <section className="bg-[var(--surface)] py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--brand-teal)]">
              Casos de uso
            </p>
            <h1
              className="text-4xl font-bold leading-tight md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Pensado para los servicios públicos cooperativos
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Cada vertical tiene reglas distintas. Atheria se adapta a la
              operación real de tu cooperativa.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
            {CASES.map((c) => (
              <article
                key={c.title}
                className="flex gap-5 rounded-2xl border border-border bg-card p-8"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: "var(--brand-teal)" }}
                >
                  <c.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {c.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--brand-deep)]">
                    {c.typical}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[var(--brand-deep)] py-16 text-white">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 text-center">
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ¿Tu cooperativa no encaja en estas categorías?
            </h2>
            <p className="text-white/70">
              Hablemos. Adaptamos la plataforma a tu modelo de gestión.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-[var(--brand-teal)] text-white hover:bg-[var(--brand-teal)]/90"
            >
              <Link to="/contacto">Contactar al equipo</Link>
            </Button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}