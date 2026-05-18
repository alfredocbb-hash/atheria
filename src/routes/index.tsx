import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Droplets,
  FileText,
  Gauge,
  LayoutGrid,
  Lock,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { useAuth } from "@/hooks/use-auth";
import { getPublicPlans } from "@/lib/public-marketing.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atheria — Sistemas de gestión que crecen con tu organización" },
      {
        name: "description",
        content:
          "Atheria es la plataforma de sistemas de gestión para cooperativas y organizaciones de servicios. Facturación, socios, lecturas y reclamos en un solo lugar.",
      },
      { property: "og:title", content: "Atheria — Plataforma de sistemas de gestión" },
      {
        property: "og:description",
        content:
          "Una plataforma, muchos sistemas. Empezá con el módulo para cooperativas de servicios públicos.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: AtheriaHome,
});

function AtheriaHome() {
  const auth = useAuth();
  const fetchPlans = useServerFn(getPublicPlans);
  const { data } = useQuery({
    queryKey: ["public-plans-home"],
    queryFn: () => fetchPlans(),
  });
  const plans = data?.plans ?? [];

  return (
    <div className="min-h-screen bg-white text-foreground">
      <MarketingHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-[var(--brand-surface)]">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-[var(--brand-surface)] to-white" />
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.05fr_1fr] md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-teal)]/30 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--brand-deep)]">
              <Sparkles className="h-3.5 w-3.5" /> Plataforma Atheria
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[var(--brand-deep)] md:text-6xl">
              Sistemas de gestión que crecen con tu organización
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Atheria reúne en una sola plataforma los sistemas que tu cooperativa o
              empresa de servicios necesita para operar día a día: socios, lecturas,
              facturación, reclamos y reportes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {auth.isAuthenticated && auth.rolesLoaded ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-[var(--brand-deep)] text-white hover:bg-[var(--brand-deep)]/90"
                >
                  <Link to={auth.isAdminOrOperator ? "/admin" : "/cliente"}>
                    Volver a mi panel <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-[var(--brand-deep)] text-white hover:bg-[var(--brand-deep)]/90"
                  >
                    <Link to="/contacto">
                      Solicitar demo <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/acceder">Acceder a mi cooperativa</Link>
                  </Button>
                </>
              )}
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
              <Stat value="100%" label="En la nube" />
              <Stat value="24/7" label="Disponibilidad" />
              <Stat value="ISO" label="Buenas prácticas" />
            </dl>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl border border-border bg-white p-5 shadow-[0_30px_60px_-30px_rgba(12,35,64,0.35)]">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand-deep)] text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[var(--brand-deep)]">
                    Cooperativa Demo
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Panel administrativo · Atheria
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Online
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniMetric label="Socios activos" value="1.284" tone="deep" />
                <MiniMetric label="Facturación mes" value="$ 8.4M" tone="teal" />
                <MiniMetric label="Lecturas hoy" value="312" />
                <MiniMetric label="Reclamos abiertos" value="9" />
              </div>
              <div className="mt-4 rounded-lg border border-dashed border-border bg-[var(--brand-surface)] p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-[var(--brand-deep)]">
                  Próximo cierre de facturación
                </p>
                <p>15 días · 1.118 suministros listos para emitir</p>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-border bg-white p-4 shadow-lg md:block">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-teal)]">
                Módulo Socios
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--brand-deep)]">
                Nuevo socio aprobado
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SISTEMAS DISPONIBLES */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-teal)]">
              Una plataforma · muchos sistemas
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--brand-deep)] md:text-4xl">
              Empezás por lo que necesitás hoy. Sumás el resto cuando crezcas.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Atheria se piensa como una red de sistemas integrados. Hoy está disponible
              el módulo para cooperativas de servicios públicos. Pronto se sumarán más.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <SystemCard
              status="active"
              title="Cooperativas de servicios"
              description="Gestión integral: socios, suministros, lecturas, facturación y reclamos técnicos."
              icon={<Droplets className="h-5 w-5" />}
              cta={<Link to="/funcionalidades">Ver funcionalidades</Link>}
            />
            <SystemCard
              status="soon"
              title="Administración condominios"
              description="Expensas, padrón de unidades, reclamos y comunicación con propietarios."
              icon={<Building2 className="h-5 w-5" />}
            />
            <SystemCard
              status="roadmap"
              title="Pymes de servicios"
              description="Clientes, contratos, facturación recurrente y cuentas corrientes."
              icon={<LayoutGrid className="h-5 w-5" />}
            />
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="border-b border-border bg-[var(--brand-surface)]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:items-start">
            <div className="md:sticky md:top-28">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-teal)]">
                Funcionalidades
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--brand-deep)] md:text-4xl">
                Todo lo que tu cooperativa necesita, sin pelearse con el sistema
              </h2>
              <p className="mt-4 text-muted-foreground">
                Cada módulo está pensado para acompañar el trabajo real de oficina y
                de campo, con permisos por rol y trazabilidad de cada movimiento.
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link to="/funcionalidades">
                  Ver todas las funcionalidades <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Feature
                icon={<Users />}
                title="Socios y suministros"
                text="Padrón único de socios con todos sus medidores, planes y estado de cuenta."
              />
              <Feature
                icon={<Gauge />}
                title="Lecturas en campo"
                text="Recorridos optimizados, lectura por sectores y control de inconsistencias."
              />
              <Feature
                icon={<FileText />}
                title="Facturación"
                text="Períodos, conceptos, recargos e impresión masiva o envío digital."
              />
              <Feature
                icon={<Wrench />}
                title="Reclamos técnicos"
                text="Cortes, fugas y reparaciones con asignación a cuadrillas y seguimiento."
              />
              <Feature
                icon={<Lock />}
                title="Roles y permisos"
                text="Administradores, operadores, lectoristas y socios con vistas dedicadas."
              />
              <Feature
                icon={<Sparkles />}
                title="Multi-cooperativa"
                text="Una sola plataforma para gestionar varias entidades con datos aislados."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CASOS DE USO */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-teal)]">
                Casos de uso
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--brand-deep)] md:text-4xl">
                Pensada para los servicios que sostienen a una comunidad
              </h2>
            </div>
            <Button asChild variant="ghost" className="text-[var(--brand-deep)]">
              <Link to="/casos">
                Ver todos los casos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <UseCase icon={<Droplets />} title="Agua potable" text="Lecturas por medidor, consumo escalonado y control de pérdidas." />
            <UseCase icon={<Zap />} title="Energía eléctrica" text="Tarifas por categoría, cargos fijos y facturación periódica." />
            <UseCase icon={<Wrench />} title="Gas y cloacas" text="Servicios técnicos con cuadrillas y mantenimiento preventivo." />
            <UseCase icon={<Building2 />} title="Internet rural" text="Planes, abonos y reclamos de conectividad en un solo lugar." />
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section className="border-b border-border bg-[var(--brand-surface)]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-teal)]">
              Planes y precios
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--brand-deep)] md:text-4xl">
              Planes que se adaptan al tamaño de tu cooperativa
            </h2>
            <p className="mt-4 text-muted-foreground">
              Empezá con un plan base y agregá módulos a medida que tu equipo crezca.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {plans.slice(0, 3).map((plan, idx) => (
              <PlanCard
                key={plan.id}
                name={plan.name}
                description={plan.description ?? ""}
                price={formatPrice(plan.price_cents, plan.currency)}
                featured={idx === 1}
              />
            ))}
            {plans.length === 0 &&
              [0, 1, 2].map((i) => (
                <PlanCard
                  key={i}
                  name={["Inicial", "Profesional", "Federación"][i]}
                  description="Próximamente disponible"
                  price="—"
                  featured={i === 1}
                />
              ))}
          </div>

          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/precios">Ver detalle de planes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-[var(--brand-deep)] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Modernicemos juntos la gestión de tu cooperativa
            </h2>
            <p className="mt-4 max-w-xl text-white/80">
              Coordinamos una demo personalizada para mostrarte cómo Atheria se adapta
              al funcionamiento real de tu organización.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Button
              asChild
              size="lg"
              className="bg-white text-[var(--brand-deep)] hover:bg-white/90"
            >
              <Link to="/contacto">
                Solicitar demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link to="/acceder">Ya soy socio · acceder</Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-display text-2xl font-bold text-[var(--brand-deep)]">
        {value}
      </dt>
      <dd className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </dd>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "deep" | "teal";
}) {
  const bg =
    tone === "deep"
      ? "bg-[var(--brand-deep)] text-white"
      : tone === "teal"
        ? "bg-[var(--brand-teal)] text-white"
        : "bg-[var(--brand-surface)] text-[var(--brand-deep)]";
  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <p className="text-[10px] uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  );
}

function SystemCard({
  status,
  title,
  description,
  icon,
  cta,
}: {
  status: "active" | "soon" | "roadmap";
  title: string;
  description: string;
  icon: React.ReactNode;
  cta?: React.ReactNode;
}) {
  const badge = {
    active: { text: "Disponible", cls: "bg-emerald-100 text-emerald-700" },
    soon: { text: "Próximamente", cls: "bg-amber-100 text-amber-700" },
    roadmap: { text: "En roadmap", cls: "bg-slate-100 text-slate-600" },
  }[status];

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-6 transition-shadow ${
        status === "active"
          ? "border-[var(--brand-deep)] shadow-[0_20px_50px_-30px_rgba(12,35,64,0.4)]"
          : "border-border opacity-90"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-surface)] text-[var(--brand-deep)]">
          {icon}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
          {badge.text}
        </span>
      </div>
      <h3 className="mt-5 font-display text-xl font-bold text-[var(--brand-deep)]">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{description}</p>
      {cta && (
        <div className="mt-5 text-sm font-semibold text-[var(--brand-teal)]">
          {cta}
        </div>
      )}
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--brand-deep)] text-white">
        {icon}
      </div>
      <p className="mt-4 font-semibold text-[var(--brand-deep)]">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function UseCase({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-[var(--brand-surface)] p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[var(--brand-deep)]">
        {icon}
      </div>
      <p className="mt-4 font-semibold text-[var(--brand-deep)]">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function PlanCard({
  name,
  description,
  price,
  featured,
}: {
  name: string;
  description: string;
  price: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 ${
        featured
          ? "border-[var(--brand-deep)] bg-white shadow-[0_30px_60px_-30px_rgba(12,35,64,0.4)]"
          : "border-border bg-white"
      }`}
    >
      {featured && (
        <span className="mb-3 inline-flex w-fit rounded-full bg-[var(--brand-deep)] px-2.5 py-0.5 text-[10px] font-semibold text-white">
          Recomendado
        </span>
      )}
      <h3 className="font-display text-xl font-bold text-[var(--brand-deep)]">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <p className="mt-6 font-display text-3xl font-bold text-[var(--brand-deep)]">
        {price}
      </p>
      <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
        <li className="flex gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--brand-teal)]" /> Soporte por email
        </li>
        <li className="flex gap-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--brand-teal)]" /> Actualizaciones incluidas
        </li>
      </ul>
      <Button
        asChild
        className={`mt-6 ${
          featured
            ? "bg-[var(--brand-deep)] text-white hover:bg-[var(--brand-deep)]/90"
            : ""
        }`}
        variant={featured ? "default" : "outline"}
      >
        <Link to="/contacto">Contactar ventas</Link>
      </Button>
    </div>
  );
}

function formatPrice(cents: number, currency: string) {
  const value = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$ ${value.toLocaleString("es-AR")}`;
  }
}
