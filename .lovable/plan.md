## Nuevo tema "Atheria Tech" + menú y botones modernos

Refrescar la identidad visual a partir de los colores del logo (navy + azul tech + cyan + verde lima) y darle un tratamiento más tecnológico al sidebar, la barra superior y los botones. Se trabaja sobre tokens semánticos y variantes de componentes — no se reescribe ninguna ruta ni lógica.

### Paleta extraída del logo

```text
Navy profundo     #0B2340   fondo institucional, primary
Navy medio        #173A5E   superficies elevadas
Azul tech         #2E9CCB   acento principal interactivo
Cyan brillante    #5BC8E6   focus rings, glow, highlights
Verde lima        #8FD14F   activo / éxito / acento secundario
Plata logo        #C6CED6   bordes sutiles
Off-white frío    #F4F7FB   superficie clara
```

### 1. Tokens de diseño — `src/styles.css`

- **Light mode (`:root`)**: background off-white frío, `--primary` navy profundo, `--accent` azul tech, `--ring` cyan brillante, `--border` plata muy clara.
- **Dark mode (`.dark`)**: background navy casi-negro, `--card` navy medio, `--primary` cyan brillante, `--accent` verde lima.
- **Tokens de marca y gradientes (nuevos)**:
  - `--brand-deep`, `--brand-blue`, `--brand-cyan`, `--brand-lime`
  - `--gradient-brand`: navy → azul tech → cyan (diagonal 135°)
  - `--gradient-accent`: azul tech → verde lima
  - `--gradient-sidebar`: navy profundo → navy medio (vertical)
  - `--shadow-glow`: halo cyan suave para hover
  - `--shadow-elevated`: sombra fría para cards/menus
- **Estados** (`--status-*`, `--priority-*`) recalibrados a la paleta.
- **Charts** (`--chart-1..5`) recoloreados con navy/azul tech/cyan/lime/plata.

### 2. Sidebar más tecnológico — `src/components/ui/sidebar.tsx` + layouts

- Fondo del sidebar usando `--gradient-sidebar` (navy degradado) en lugar de color plano, con un borde derecho de 1px en cyan al 15% para sutil "circuit edge".
- Logo + título con tracking más amplio (`tracking-[0.18em] uppercase`) y peso ligero — vibra SaaS tech.
- Ítems de menú:
  - Estado normal: texto plata claro, icono outline plata
  - Hover: fondo `bg-white/5`, icono pasa a cyan, transición de 200ms
  - Activo: barra vertical lima de 2px a la izquierda + fondo `bg-white/8` + texto blanco + icono cyan, en lugar del fondo accent macizo actual
- Separadores muy finos (`border-white/8`) y label de grupo en `text-[10px] uppercase tracking-[0.2em] text-white/40`.
- Footer del sidebar con avatar/email en bloque compacto y botón "Cerrar sesión" estilo ghost con icono.
- Aplica al sidebar del backoffice (`admin-portal-layout`) y al de super (`super.tsx`) usando los mismos tokens, sin duplicar estilos.

### 3. Barra superior (header del admin)

- Fondo `bg-card/80 backdrop-blur` con `border-b border-border/60` para efecto "glass".
- Tipografía del título de página en `font-display` con tracking sutil.
- Chip "Actuando como: …" rediseñado: pill con borde cyan, fondo `bg-cyan/10`, icono y botón X minimalista.
- Notificaciones (`NotificationsBell`) con badge en lima.

### 4. Botones — `src/components/ui/button.tsx`

Añadir/ajustar variantes (manteniendo `default`, `outline`, `ghost`, `destructive`, `link`, `secondary` existentes):

- `default`: navy sólido en light / cyan en dark, con `shadow-sm` y hover que aplica `shadow-glow` (halo cyan) + leve `-translate-y-px` (≤120ms).
- **Nueva** `tech`: gradiente `--gradient-brand` con texto blanco, borde interior sutil (`inset 0 1px 0 white/10`) y glow cyan en hover. Pensada para CTAs primarias (login, "Nuevo registro", "Guardar").
- **Nueva** `glow`: outline cyan transparente con texto cyan, hover rellena fondo `bg-cyan/10` y agrega glow. Para acciones secundarias destacadas.
- `outline`: borde `border-border/70`, hover sube a borde cyan + texto cyan.
- `ghost`: hover `bg-foreground/5` + texto accent.
- Todos los botones: `rounded-md` (consistente con `--radius`), `font-medium`, transición 150ms en color/shadow/transform; sin gradientes chillones, todo medido.
- Los botones "Nuevo registro" en las esquinas de las pestañas (`admin.socios`, `admin.suministros`, etc.) pasan a la variante `tech` para que la acción primaria destaque sin sobrecargar.

### 5. Inputs, tabs y badges (refinamientos consistentes)

- **Inputs/Select**: borde `border-input` neutral, focus pasa a `ring-2 ring-ring/40 border-ring` (cyan) — ya soportado por tokens, solo verificar.
- **Tabs** del workspace: indicador activo como subrayado de 2px en cyan en lugar de pill macizo, texto activo en `text-foreground`.
- **Badges de estado**: usar tokens `--status-*` ya recalibrados (verde lima para activo/pagado, ámbar para pendiente, coral para vencido) con fondos al 12% y texto al 100%.

### Fuera de alcance

- No se cambian rutas, lógica, queries ni layouts estructurales.
- Tipografía actual (`Space Grotesk` + `Inter`) se conserva — ya transmite el tono tech.
- No se modifica el logo ni assets de marca.
- No se aplica a `/cliente` (portal de usuario final) en esta tanda salvo herencia automática de tokens.

### Detalles técnicos

Archivos a tocar:

```text
src/styles.css                                  (tokens, gradientes, sombras)
src/components/ui/button.tsx                    (variantes tech + glow, refinar default/outline)
src/components/ui/sidebar.tsx                   (gradiente de fondo, ítem activo, separadores)
src/components/layouts/admin-portal-layout.tsx  (header glass, chip "Actuando como")
src/routes/_authenticated/super.tsx             (sidebar con mismos estilos)
src/components/workspace/workspace-tabs-bar.tsx (subrayado cyan en tab activa)
```

### Verificación

Tras aplicar, revisar visualmente:
1. Login / landing — botón primario `tech`, focus cyan.
2. `/admin` — sidebar con gradiente, ítem activo con barra lima, header glass.
3. Pestañas con botón "Nuevo …" en esquina superior derecha.
4. Tablas con badges de estado.
5. `/super` — mismo lenguaje visual.
