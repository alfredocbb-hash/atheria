import { cn } from "@/lib/utils";

interface AtheriaMarkProps {
  className?: string;
  variant?: "default" | "light";
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  /** Altura exacta en px — tiene prioridad sobre `size` */
  imageHeight?: number;
}

export function AtheriaMark({
  className,
  variant = "default",
  showTagline = false,
  size = "md",
  imageHeight,
}: AtheriaMarkProps) {
  const isLight = variant === "light";

  const heights: Record<string, string> = {
    sm: "48px",
    md: "72px",
    lg: "96px",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src="/atheria-logo.jpeg"
        alt="Atheria Software & Consulting"
        style={{
          height: imageHeight ? `${imageHeight}px` : heights[size],
          width: "auto",
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
