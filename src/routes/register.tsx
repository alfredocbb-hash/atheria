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
  full_name: z.string().min(2, "Ingrese su nombre completo").max(120),
  email: z.string().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
type RegisterInput = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Crear cuenta — Coopecur 2.0" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate({ to: "/cliente", replace: true });
    }
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
    toast.success("Cuenta creada", {
      description: "Revise su email para confirmar el registro.",
    });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Error con Google", { description: result.error.message });
    }
  };

  return (
    <AuthShell
      title="Crear cuenta de socio"
      subtitle="Acceda a su Oficina Virtual de Coopecur"
      footer={
        <>
          ¿Ya tiene cuenta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Inicie sesión
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input id="full_name" {...form.register("full_name")} />
          {form.formState.errors.full_name && (
            <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
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