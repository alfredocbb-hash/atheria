import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const schema = z.object({
  full_name: z
    .string()
    .min(2, "Ingrese su nombre completo (mín. 2 caracteres)")
    .max(120)
    .transform((s) => s.trim())
    .refine((s) => s.length >= 2, "No puede contener solo espacios"),
  email: z
    .string()
    .email("Ingrese un email válido")
    .transform((s) => s.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(128, "Máximo 128 caracteres")
    .refine(
      (s) => /[A-Z]/.test(s) || /[0-9]/.test(s),
      "Incluí al menos una mayúscula o un número"
    ),
});
type RegisterInput = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Crear cuenta — Atheria" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) navigate({ to: "/cliente", replace: true });
  }, [auth.isAuthenticated, navigate]);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterInput) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: values.full_name },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo crear la cuenta", { description: error.message });
      return;
    }
    toast.success("Cuenta creada", { description: "Revisá tu email para confirmar el registro." });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Error con Google", { description: result.error.message });
  };

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Accedé a tu cooperativa desde Atheria"
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Iniciá sesión</Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input id="full_name" autoComplete="name" {...form.register("full_name")} placeholder="Juan Pérez" />
          {form.formState.errors.full_name && (
            <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} placeholder="juan@ejemplo.com" />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
          <p className="text-[11px] text-muted-foreground">Mín. 8 caracteres, incluí una mayúscula o número</p>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear cuenta
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
        Continuar con Google
      </Button>
    </AuthShell>
  );
}
