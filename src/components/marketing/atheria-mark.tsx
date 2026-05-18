import { cn } from "@/lib/utils";

interface AtheriaMarkProps {
  className?: string;
  variant?: "default" | "light";
}

export function AtheriaMark({ className, variant = "default" }: AtheriaMarkProps) {
  const isLight = variant === "light";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          isLight ? "bg-white/10" : "bg-[var(--brand-deep)]"
        )}
        aria-hidden
      >
        <div
          className="h-3.5 w-3.5 rotate-45 border-2"
          style={{ borderColor: "var(--brand-teal)" }}
        />
      </div>
      <span
        className={cn(
          "text-xl font-bold uppercase tracking-tight",
          isLight ? "text-white" : "text-[var(--brand-deep)]"
        )}
        style={{ fontFamily: "var(--font-display)" }}
      >
        Atheria
      </span>
    </div>
  );
}