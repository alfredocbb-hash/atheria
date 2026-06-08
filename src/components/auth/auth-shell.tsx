import { Link } from "@tanstack/react-router";
import { AtheriaMark } from "@/components/marketing/atheria-mark";
import { Building2, CheckCircle2, Droplets, Users, FileText, Wrench } from "lucide-react";

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
    <div className="flex min-h-screen">
      {/* ── LEFT: formulario ── */}
      <div className="flex w-full flex-col justify-between bg-white px-8 py-10 md:w-[46%] md:px-14 lg:px-20">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <AtheriaMark />
        </Link>

        {/* Form card */}
        <div className="mx-auto w-full max-w-sm">
          <h1
            className="text-2xl font-bold tracking-tight text-[var(--brand-deep)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
          {footer && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </p>
          )}
        </div>

        {/* Bottom link */}
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Atheria · Todos los derechos reservados
        </p>
      </div>

      {/* ── RIGHT: panel de marca ── */}
      <div
        className="hidden flex-col justify-between overflow-hidden md:flex md:w-[54%]"
        style={{ background: "var(--gradient-brand)" }}
      >
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] -translate-y-1/4 translate-x-1/4 rounded-full opacity-10"
          style={{ background: "var(--brand-cyan)", filter: "blur(80px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-[320px] w-[320px] translate-y-1/3 -translate-x-1/4 rounded-full opacity-10"
          style={{ background: "var(--brand-lime)", filter: "blur(80px)" }}
        />

        <div className="relative z-10 flex flex-1 flex-col justify-center px-14 py-16 xl:px-20">
          {/* Eyebrow */}
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
            <Droplets className="h-3 w-3" />
            Plataforma Atheria
          </span>

          {/* Headline */}
          <h2
            className="mt-6 text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Gestión integral para cooperativas de servicios
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Socios, lecturas, facturación y reclamos técnicos en una sola plataforma.
            Sin instalaciones, disponible desde cualquier lugar.
          </p>

          {/* Feature list */}
          <ul className="mt-10 space-y-3.5">
            {[
              { icon: <Users className="h-4 w-4" />, text: "Padrón de socios y suministros" },
              { icon: <FileText className="h-4 w-4" />, text: "Facturación y períodos de cierre" },
              { icon: <Wrench className="h-4 w-4" />, text: "Reclamos técnicos con cuadrillas" },
              { icon: <CheckCircle2 className="h-4 w-4" />, text: "Roles: administradores, lectoristas y socios" },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15 text-white">
                  {icon}
                </span>
                {text}
              </li>
            ))}
          </ul>

          {/* Stats bar */}
          <div className="mt-12 grid grid-cols-3 gap-4 rounded-2xl border border-white/15 bg-white/8 p-6 backdrop-blur-sm">
            {[
              { value: "100%", label: "En la nube" },
              { value: "24/7", label: "Disponible" },
              { value: "Multi", label: "Cooperativa" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {value}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-widest text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom brand note */}
        <div className="relative z-10 border-t border-white/10 px-14 py-5 xl:px-20">
          <p className="text-xs text-white/50">
            Primer sistema disponible: Cooperativas de servicios públicos
          </p>
        </div>
      </div>
    </div>
  );
}
