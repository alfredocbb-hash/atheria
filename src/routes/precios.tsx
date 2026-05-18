import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { getPublicPlans } from "@/lib/public-marketing.functions";

export const Route = createFileRoute("/precios")({
  head: () => ({
    meta: [
      { title: "Planes y precios — Atheria" },
      {
        name: "description",
        content:
          "Planes mensuales para cooperativas de servicios. 14 días de prueba sin tarjeta.",
      },
      { property: "og:title", content: "Planes y precios — Atheria" },
      {
        property: "og:description",
        content: "Elegí el plan que se ajusta a tu cooperativa.",
      },
      { property: "og:url", content: "/precios" },
    ],
    links: [{ rel: "canonical", href: "/precios" }],
  }),
  component: PreciosPage,
});

function PreciosPage() {
  const fetchPlans = useServerFn(getPublicPlans);
  const { data, isLoading } = useQuery({
    queryKey: ["public-plans"],
    queryFn: () => fetchPlans(),
  });

  const plans = data?.plans ?? [];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <section className="bg-[var(--surface)] py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--brand-teal)]">
              Planes
            </p>
            <h1
              className="text-4xl font-bold leading-tight md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Precios simples, sin sorpresas
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Empezá con 14 días gratis. Sin tarjeta de crédito. Cambiá o
              cancelá cuando quieras.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : plans.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Próximamente publicaremos los planes disponibles.
              </p>
            ) : (
              <div className="grid gap-8 md:grid-cols-3">
                {plans.map((p, i) => {
                  const featured = i === Math.floor(plans.length / 2);
                  const features = Array.isArray(
                    (p.features as { items?: string[] } | null)?.items
                  )
                    ? ((p.features as { items: string[] }).items ?? [])
                    : [];
                  return (
                    <article
                      key={p.id}
                      className={
                        featured
                          ? "relative flex flex-col rounded-2xl bg-[var(--brand-deep)] p-10 text-white shadow-2xl"
                          : "flex flex-col rounded-2xl border border-border bg-card p-10"
                      }
                    >
                      {featured && (
                        <span
                          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                          style={{ background: "var(--brand-teal)" }}
                        >
                          Recomendado
                        </span>
                      )}
                      <h2
                        className="text-xl font-bold"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {p.name}
                      </h2>
                      <p
                        className={
                          featured
                            ? "mt-2 text-sm text-white/70"
                            : "mt-2 text-sm text-muted-foreground"
                        }
                      >
                        {p.description ?? "Plan mensual"}
                      </p>
                      <p className="mt-8 text-4xl font-bold">
                        ${(p.price_cents / 100).toLocaleString("es-AR")}
                        <span
                          className={
                            featured
                              ? "text-base font-normal text-white/60"
                              : "text-base font-normal text-muted-foreground"
                          }
                        >
                          /mes
                        </span>
                      </p>
                      <ul className="mt-8 flex-1 space-y-3 text-sm">
                        {features.length === 0 ? (
                          <li
                            className={
                              featured
                                ? "text-white/60"
                                : "text-muted-foreground"
                            }
                          >
                            14 días de prueba incluidos
                          </li>
                        ) : (
                          features.map((f: string) => (
                            <li key={f} className="flex items-start gap-2">
                              <Check
                                className="mt-0.5 h-4 w-4 shrink-0"
                                style={{ color: "var(--brand-teal)" }}
                              />
                              <span>{f}</span>
                            </li>
                          ))
                        )}
                      </ul>
                      <Button
                        asChild
                        size="lg"
                        className={
                          featured
                            ? "mt-10 bg-[var(--brand-teal)] text-white hover:bg-[var(--brand-teal)]/90"
                            : "mt-10 bg-[var(--brand-deep)] text-white hover:bg-[var(--brand-deep)]/90"
                        }
                      >
                        <Link to="/register">Empezar 14 días gratis</Link>
                      </Button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="bg-[var(--surface)] py-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 text-center">
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ¿Necesitás algo a medida?
            </h2>
            <p className="text-muted-foreground">
              Para cooperativas grandes o requisitos especiales armamos un plan
              corporativo.
            </p>
            <Button asChild variant="outline" size="lg">
              <Link to="/contacto">Hablar con ventas</Link>
            </Button>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}