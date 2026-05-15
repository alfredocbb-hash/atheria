import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const requestSchema = z.object({ email: z.string().email() });
const updateSchema = z.object({ password: z.string().min(8, "Mínimo 8 caracteres") });

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Recuperar contraseña — Coopecur 2.0" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [mode, setMode] = useState<"request" | "update">("request");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("type=recovery")) setMode("update");
  }, []);

  const requestForm = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });
  const updateForm = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: { password: "" },
  });

  const sendRecovery = async (values: z.infer<typeof requestSchema>) => {
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) return toast.error("No se pudo enviar el email", { description: error.message });
    toast.success("Revise su correo electrónico para continuar.");
  };

  const updatePassword = async (values: z.infer<typeof updateSchema>) => {
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSubmitting(false);
    if (error) return toast.error("No se pudo actualizar la contraseña", { description: error.message });
    toast.success("Contraseña actualizada. Inicie sesión nuevamente.");
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (mode === "update") {
    return (
      <AuthShell title="Definir nueva contraseña" subtitle="Ingrese su nueva contraseña">
        <form onSubmit={updateForm.handleSubmit(updatePassword)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input id="password" type="password" {...updateForm.register("password")} />
            {updateForm.formState.errors.password && (
              <p className="text-xs text-destructive">{updateForm.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar contraseña
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Le enviaremos un email con un enlace para reestablecerla"
      footer={<Link to="/login" className="font-medium text-primary hover:underline">Volver al inicio de sesión</Link>}
    >
      <form onSubmit={requestForm.handleSubmit(sendRecovery)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...requestForm.register("email")} />
          {requestForm.formState.errors.email && (
            <p className="text-xs text-destructive">{requestForm.formState.errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar enlace
        </Button>
      </form>
    </AuthShell>
  );
}
