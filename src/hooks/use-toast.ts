// Shim de compatibilidad: expone la API clásica de shadcn useToast
// pero delega en sonner, que es lo que usa el resto del proyecto.
import { toast as sonnerToast } from "sonner";

type ToastInput = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const toast = ({ title, description, variant }: ToastInput) => {
    if (variant === "destructive") {
      sonnerToast.error(title ?? "Error", { description });
    } else {
      sonnerToast(title ?? "", { description });
    }
  };
  return { toast };
}

export { sonnerToast as toast };
