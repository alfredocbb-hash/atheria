import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2, Loader2 } from "lucide-react";
import { searchPublicTenants } from "@/lib/public-marketing.functions";

export const Route = createFileRoute("/acceder")({
  head: () => ({
    meta: [
      { title: "Acceder a mi cooperativa — Atheria" },
      {
        name: "description",
        content:
          "Buscá tu cooperativa para entrar a tu oficina virtual del socio.",
      },
      { property: "og:title", content: "Acceder a mi cooperativa — Atheria" },
      {
        property: "og:description",
        content: "Buscá tu cooperativa para entrar a tu oficina virtual.",
      },
      { property: "og:url", content: "/acceder" },
    ],
    links: [{ rel: "canonical", href: "/acceder" }],
  }),
  component: AccederPage,
});

function AccederPage() {
  const search = useServerFn(searchPublicTenants);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<
    { id: string; name: string; slug: string; status: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 1) return;
    setLoading(true);
    try {
      const { results } = await search({ data: { q: q.trim() } });
      setResults(results);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <section className="bg-[var(--surface)] py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--brand-teal)]">
              Soy socio
            </p>
            <h1
              className="text-4xl font-bold leading-tight md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Encontrá tu cooperativa
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Buscá por nombre y entrá a tu oficina virtual.
            </p>

            <form
              onSubmit={onSearch}
              className="mt-10 flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ej: Coop. Eléctrica Las Heras"
                  className="border-0 pl-9 shadow-none focus-visible:ring-0"
                  maxLength={80}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[var(--brand-deep)] text-white hover:bg-[var(--brand-deep)]/90"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </form>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-6">
            {searched && results.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No encontramos cooperativas con ese nombre.
                </p>
                <p className="mt-3 text-sm">
                  ¿Tu cooperativa todavía no está en Atheria?{" "}
                  <Link to="/contacto" className="font-semibold text-[var(--brand-teal)] underline">
                    Sugerila
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate({ to: "/login" })}
                    className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-[var(--brand-teal)]"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: "var(--brand-teal)" }}
                    >
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">/{t.slug}</p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-deep)]">
                      Acceder →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}