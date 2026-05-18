import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";

interface DeleteButtonProps {
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  label?: string;
  pending?: boolean;
  size?: "sm" | "default" | "icon";
  variant?: "ghost" | "outline" | "destructive";
  iconOnly?: boolean;
  adminOnly?: boolean;
}

export function DeleteButton({
  onConfirm,
  title = "¿Eliminar este registro?",
  description = "Esta acción no se puede deshacer.",
  label = "Eliminar",
  pending = false,
  size = "sm",
  variant = "ghost",
  iconOnly = false,
  adminOnly = true,
}: DeleteButtonProps) {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  if (adminOnly && !auth.hasRole("admin")) return null;
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={variant === "ghost" ? "text-destructive hover:text-destructive" : ""}
        title={label}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {!iconOnly && <span className="ml-1">{label}</span>}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => { await onConfirm(); setOpen(false); }}
            >
              {label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}