import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
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
  email: z.string().email("Ingrese un email válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type LoginInput = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Iniciar sesión — Coopecur 2.0" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return;
    const [{ data: roleRows }, { data: superRow }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    ]);
    const roles = (roleRows ?? []).map((r) => r.role as string);
    const isStaff = roles.includes("admin") || roles.includes("operator");
    const isSuper = !!superRow;
    const dest = isSuper ? "/super" : isStaff ? "/admin" : "/cliente";
    throw redirect({ to: dest, replace: true });
  },
  component: LoginPage,
});

function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userId = auth.user?.id;
    if (!auth.isAuthenticated || !auth.rolesLoaded || !userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      const dest = data
        ? "/super"
        : auth.isAdminOrOperator
          ? "/admin"
          : "/cliente";
      navigate({ to: dest, replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.isAuthenticated, auth.rolesLoaded, auth.isAdminOrOperator, auth.user?.id, navigate]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword(values);
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo iniciar sesión", { description: error.message });
      return;
    }
    toast.success("Bienvenido/a a Coopecur 2.0");
    // Red de seguridad: navegar de inmediato según los roles del usuario
    // recién autenticado, sin esperar a que el listener de onAuthStateChange
    // hidrate `rolesLoaded` en el hook useAuth.
    const userId = data.session?.user.id;
    let isStaff = false;
    let isSuper = false;
    if (userId) {
      const [{ data: roleRows }, { data: superRow }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("super_admins").select("user_id").eq("user_id", userId).maybeSingle(),
      ]);
      const roles = (roleRows ?? []).map((r) => r.role as string);
      isStaff = roles.includes("admin") || roles.includes("operator");
      isSuper = !!superRow;
    }
    navigate({ to: isSuper ? "/super" : isStaff ? "/admin" : "/cliente", replace: true });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Error con Google", { description: result.error.message });
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Defensive: ensure we never let the browser do a native GET submit
    // (which would leak email/password into the URL) even if hydration
    // hasn't fully attached react-hook-form's handler yet.
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit(onSubmit)(event);
  };

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Ingrese a su cuenta de Coopecur"
      footer={
        <>
          ¿Aún no tiene cuenta?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Regístrese
          </Link>
        </>
      }
    >
      {auth.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
      <form
        onSubmit={handleFormSubmit}
        method="post"
        action="?"
        noValidate
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              to="/reset-password"
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              ¿Olvidó su contraseña?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ingresar
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
        </>
      )}
    </AuthShell>
  );
}