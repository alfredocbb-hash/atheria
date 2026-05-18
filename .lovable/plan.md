## Nueva Home — Atheria (plataforma multi-sistema, primer producto: gestión de cooperativas)

Reposicionamos la home: deja de ser la oficina virtual de "Coopecur" y pasa a ser el sitio público de **Atheria**, una plataforma que en el futuro albergará varios sistemas de gestión. El primero (y único hoy) es el **sistema para cooperativas de servicios**. La home habla a dos audiencias con caminos claros: cooperativas que evalúan contratar, y socios finales que quieren acceder a la oficina virtual de su cooperativa.

## Arquitectura de rutas (separadas, no anchors)

```
src/routes/
  index.tsx         -> / (home: hero + visión de plataforma + producto activo + CTAs duales)
  funcionalidades.tsx -> /funcionalidades
  casos.tsx          -> /casos
  precios.tsx        -> /precios
  contacto.tsx       -> /contacto
  login.tsx          (ya existe)
  register.tsx       (ya existe)
  acceder.tsx       -> /acceder (buscador de cooperativa para socios)
```

Cada ruta con su `head()` propio (title, description, og:title, og:description). El header con nav compartido vive en un componente reutilizable montado desde `__root.tsx` para las rutas públicas (sin tocar `_authenticated`).

## Identidad: Atheria

- Nombre/marca: **Atheria**.
- Tagline: "Sistemas de gestión que crecen con tu organización".
- Logo: marca tipográfica simple (texto) con un mark cuadrado azul. Genero un SVG inline; si después querés un logo dibujado lo iteramos.
- Tono: institucional, confiable, sobrio. Se siente como software para entidades reguladas.

## Paleta y tokens (locked)

Aplicar a `src/styles.css` los tokens elegidos:
- Primary: `#1a4a6e` (navy medio)
- Primary deep: `#0c2340` (navy profundo, headers/footers)
- Accent: `#2d8a9e` (teal)
- Surface: `#f5f7fa` (fondo de secciones suaves)
- Texto: navy profundo sobre blanco/surface

Tipografía: Inter para body, Space Grotesk para títulos (importadas en CSS, no agrego deps).

## Contenido de la home (/)

1. **Header sticky**: logo Atheria + nav (Funcionalidades, Casos, Precios, Contacto) + botones derechos: "Acceder" (lleva a `/acceder`) y "Probar gratis" (lleva a `/register?next=/onboarding`).
2. **Hero dual**: título grande "La plataforma para administrar tu cooperativa". Subtítulo menciona Atheria y que cooperativas es el primer sistema. Dos CTAs lado a lado:
   - **Para cooperativas** → "Probar gratis 14 días" (azul primario).
   - **Para socios** → "Acceder a mi cooperativa" (outline, lleva a `/acceder`).
3. **Bloque "Una plataforma, muchos sistemas"**: 3 cards. La de "Cooperativas de servicios" en activo; otras 2 ("Mutuales", "Cooperativas de trabajo") en gris con badge "Próximamente". Esto ancla la visión multi-producto de Atheria.
4. **Funcionalidades resumidas** (4-6 cards): Socios y suministros, Lecturas de medidores, Facturación masiva, Reclamos y cuadrillas, Cobranzas, Portal del socio. Cada card linkea a `/funcionalidades`.
5. **Casos de uso** (preview): cooperativas de agua, electricidad, gas, internet rural. 4 íconos + texto breve, link a `/casos`.
6. **Precios** (preview de 3 planes leyendo de tabla `plans`): mostrar nombre + precio + 3 features, badge "14 días gratis". Server fn `getPublicPlans()` sin auth. Link a `/precios`.
7. **CTA final**: bloque navy con "Probar gratis" + "Agendar demo" (lleva a `/contacto`).
8. **Footer**: marca Atheria + nav + nota "© Atheria. Cooperativas — primer sistema disponible."

## Páginas hijas

- **/funcionalidades**: detalle por módulo (socios, lecturas, facturación, reclamos, cobranzas, portal del socio), screenshots/ilustraciones esquemáticas, secciones largas.
- **/casos**: 4 verticales (agua, electricidad, gas, internet rural) con descripción de cómo se usa el sistema en cada una.
- **/precios**: tabla completa de planes (lee `plans` activos), comparador de features, FAQ de facturación, CTA de trial.
- **/contacto**: form de contacto/demo (nombre, cooperativa, email, teléfono, mensaje) → server fn `submitContactRequest()` que inserta en nueva tabla `contact_requests` y notifica a super admins via `notifications`.
- **/acceder**: buscador de cooperativa para socios. Input con búsqueda fuzzy por nombre/slug sobre `tenants` (server fn `searchPublicTenants(q)` que devuelve solo `name`, `slug`, `province` de tenants con status='active'). Click en resultado → `/login?tenant={slug}` (el slug se guarda y se usa para sugerir el tenant al loguearse; si el usuario solo pertenece a un tenant, es informativo).

## Cambios de auth/redirect

- `index.tsx` deja de hacer `Navigate` automático para usuarios autenticados — la home es pública siempre, con un badge "Volver a mi panel" arriba a la derecha si hay sesión.
- `/login` y `/register` mantienen su lógica; agregar link "Volver al inicio" para no atrapar al visitante.

## SQL nueva

- Tabla `contact_requests(id, name, organization, email, phone, message, source, created_at, handled_by, handled_at)`.
  - RLS: insert público (anónimo via server fn que usa `supabaseAdmin`), select solo super admin.
- Trigger `contact_requests_notify` → inserta notification a todos los super admins cuando entra un lead.

## Server functions nuevas

- `getPublicPlans()` — sin auth, devuelve `plans` activos ordenados por precio.
- `searchPublicTenants(q: string)` — sin auth, devuelve nombre/slug/provincia de tenants activos que matcheen.
- `submitContactRequest(payload)` — sin auth, con validación Zod (todos los campos con min/max), rate limit simple (1 por minuto por IP — guardamos por ahora sin rate limit y lo dejamos como TODO).

## Flujo de directions visuales (durante implementación)

Antes de codear, aplico el ritual de redesign:
1. Capturo screenshot de la home actual.
2. Genero 3 design directions con paleta locked (`#0c2340 / #1a4a6e / #2d8a9e / #f5f7fa`), tipografía Space Grotesk + Inter, layout hero-grid. Las 3 varían en composición/densidad/jerarquía (ej: hero centrado vs hero split vs hero con dashboard mockup).
3. Te muestro las 3 con `ask_questions type=prototype`, elegís una, implemento esa exactamente.

## Orden de implementación

1. Tokens en `src/styles.css` + fuentes (Inter + Space Grotesk).
2. Componente `<MarketingHeader />` + `<MarketingFooter />` reutilizables.
3. Generación de directions de la home → elegís una.
4. Rehacer `/` con el direction elegido + bloque multi-sistema + preview de planes.
5. Crear `/funcionalidades`, `/casos`, `/precios`, `/contacto`, `/acceder` con metadata propia.
6. Server fns públicas + migración `contact_requests`.
7. Quitar el redirect automático en `index.tsx`.
8. QA: visitante anónimo navega, busca cooperativa, ve precios, manda contacto; super admin ve el lead en notifications.

## Fuera de alcance

- Subdominios por tenant (`miscoop.atheria.app`) — fase futura.
- Multi-idioma.
- Blog/recursos.
- Páginas legales (términos, privacidad) — placeholders.
- Logo profesional dibujado.

¿Avanzo así?
