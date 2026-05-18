import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Mail, Phone, MessageSquare } from "lucide-react";
import { submitContactRequest } from "@/lib/public-marketing.functions";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — Atheria" },
      { name: "description", content: "Hablemos sobre tu cooperativa. Agendá una demo." },
      { property: "og:title", content: "Contacto — Atheria" },
      { property: "og:description", content: "Hablemos sobre tu cooperativa. Agendá una demo." },
      { property: "og:url", content: "/contacto" },
    ],
    links: [{ rel: "canonical", href: "/contacto" }],
  }),
  component: ContactoPage,
});

function ContactoPage() {
  const submit = useServerFn(submitContactRequest);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await submit({
        data: {
          name: String(form.get("name") ?? ""),
          organization: String(form.get("organization") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          message: String(form.get("message") ?? ""),
        },
      });
      setSent(true);
      toast.success("Mensaje enviado. Te contactamos a la brevedad.");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <section className="bg-[var(--surface)] py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--brand-teal)]">
              Contacto
            </p>
            <h1
              className="text-4xl font-bold leading-tight md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Hablemos sobre tu cooperativa
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Contanos qué necesitás. Coordinamos una demo personalizada.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-[1fr_2fr]">
            <aside className="space-y-6">
              <Info icon={Mail} label="Email" value="hola@atheria.app" />
              <Info icon={Phone} label="Teléfono" value="A coordinar por mensaje" />
              <Info
                icon={MessageSquare}
                label="Respondemos"
                value="Lunes a viernes, 9 a 18 hs."
              />
            </aside>
            <form
              onSubmit={onSubmit}
              className="space-y-5 rounded-2xl border border-border bg-card p-8"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre" name="name" required minLength={2} />
                <Field label="Cooperativa / Organización" name="organization" required minLength={2} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email" name="email" type="email" required />
                <Field label="Teléfono (opcional)" name="phone" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={5}
                  minLength={10}
                  maxLength={2000}
                  required
                  placeholder="Contanos cuántos socios tenés y qué servicios brinda tu cooperativa."
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={loading || sent}
                className="w-full bg-[var(--brand-deep)] text-white hover:bg-[var(--brand-deep)]/90"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {sent ? "Mensaje enviado" : "Enviar mensaje"}
              </Button>
            </form>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        maxLength={200}
      />
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ background: "var(--brand-teal)" }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}