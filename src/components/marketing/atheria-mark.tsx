import { cn } from "@/lib/utils";

interface AtheriaMarkProps {
  className?: string;
  variant?: "default" | "light";
  showTagline?: boolean;
}

export function AtheriaMark({
  className,
  variant = "default",
  showTagline = false,
}: AtheriaMarkProps) {
  const isLight = variant === "light";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/atheria-logo.jpeg"
        alt="Atheria"
        style={{
          height: "36px",
          width: "auto",
          // Elimina el fondo blanco del JPEG mezclando con el fondo del contenedor
          mixBlendMode: isLight ? "screen" : "multiply",
          display: "block",
        }}
      />
      {showTagline && (
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-widest",
            isLight ? "text-white/60" : "text-muted-foreground"
          )}
          style={{ fontFamily: "var(--font-display)" }}
        >
          Software & Consulting
        </span>
      )}
    </div>
  );
}
