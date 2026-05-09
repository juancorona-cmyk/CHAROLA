# Estructura de la página · 100% Naturizable

Documento de referencia para modificaciones importantes. Consultar antes de mover, agregar o eliminar secciones, componentes o endpoints.

---

## Landing page (`/`)

La página principal es un single-page con 19 secciones en `src/pages/index.astro`, renderizadas en este orden de arriba hacia abajo:

| # | Componente | id / clase | Tipo | Descripción |
|---|---|---|---|---|
| 0 | `Nav.astro` | `#nav` | Fijo | Header sticky con pill-nav, logo, lang toggle, CTA y hamburger (móvil) |
| 1 | `Hero.astro` | `#inicio`, `.hero-v2` | Hero | Headline Morganite, pitch, canvas de partículas, charola PNG transparente con círculo radiante, tag "Ingeniería Suiza", botones CTA |
| 2 | `Manifesto.astro` | `#manifiesto`, `.intro-block` | Texto | Grid 2-col: título grande + cuerpo de 3 párrafos. Eyebrow con dot verde |
| 3 | `Identity.astro` | `.identity` | Lista | 5 rows numeradas con tag + role. Cada row tiene hover con flecha. SVG de fondo |
| 4 | `Tech.astro` | `.tech` | Card oscura | Card expandida con estadísticas (3 stats: barrera, origen, 0% PFAS). SVG de fondo |
| 5 | `Enpaques.astro` | `.enpaques` | Sticky scroll | Panel sticky con headline, track de video scrub, panel outro crema. Video con chips flotantes |
| 6 | `ParallaxTierra.astro` | `.plx-section` | Parallax multicapa | 300vh track: fondo → tierra → charola → suiza → planta (animada con GSAP-like manual). Sellos posicionados en triángulo en móvil |
| 7 | `Products.astro` | `#productos`, `.products` | Grid / carrusel | 3 cards: Charola 855 (disponible), Vasos (soon), Contenedores (soon). En móvil: scroll-snap horizontal |
| 8 | `Clients.astro` | `.clients` | Grid + marquee | Logo cloud con slider infinito. Fade edges a los lados |
| 9 | `Cases.astro` | `.cases` | Grid / carrusel | 4 case cards con fondo de color + tag + título. En móvil: scroll-snap |
| 10 | `Compare.astro` | `.compare` | Tabla | Tabla comparativa: Naturizable vs Cartón vs Foam vs PP. Background `--bg-alt` |
| 11 | `Effect.astro` | `.effect` | Card split | Izquierda: número grande animado (510). Derecha: título + cuerpo + CTA |
| 12 | `Partners.astro` | `.partners` | Grid | 4 cards: Lonely Whale, Tom Ford, NU, BBVA. Background `--bg-alt` |
| 13 | `Ambassadors.astro` | `#embajadores` | Sección gatillada | **Gate**: input de código + botón. Si código `MANOSDORADAS` → desbloquea contenido: pilares, tiers de compensación, formulario de postulación |
| 14 | `Events.astro` | `.events` | Lista | 5 eventos en rows con hover: Expo Pack, Foro Empaque, Sustainable Brands, Eurasia, Summit |
| 15 | `Contact.astro` | `#contacto`, `.contact` | Grid 2-col | Izquierda: datos de contacto. Derecha: QR sticky de WhatsApp |
| 16 | `FinalCTA.astro` | `.final-cta` | Card oscura | Último CTA: "¿Listo para sostener al mundo?" con botón |
| 17 | `Footer.astro` | `.footer` | Footer | 4 columnas: brand + tagline, Producto, Compañía, Contacto con regiones MX/USA |
| 18 | `Chatbot.astro` | `#chatbot` | Flotante fixed | Botón de launcher (círculo verde) + ventana con header, quick replies, input. Backend: `/api/chat` → OpenAI |

### Comportamientos globales (en `index.astro` <script>)

- **Lenis smooth scroll**: duración 1.2s, easing exponencial
- **Barra de progreso**: `#progressBar` — scaleX basado en scroll
- **Cursor glow**: `#cursorGlow` — sigue el mouse, solo en hover devices
- **Reveal animations**: `.reveal`, `.reveal-left`, `.reveal-right`, `.reveal-scale`, `.reveal-fade` — se activan al entrar al viewport (IntersectionObserver, threshold 0.1). En móvil se muestran sin animación
- **Hero entrance**: `.hero-v2-left` y `#heroProductWrap` se animan al entrar al viewport, se resetean al salir
- **Canvas particles**: 45 partículas doradas en el hero, solo animadas cuando el hero es visible
- **Mobile menu**: hamburger → overlay full-screen con links Morganite numerados
- **Pill nav cursor**: sliding highlight en el nav-pill de escritorio
- **Language toggle**: ES/EN runtime, actualiza todos los `[data-i18n]`
- **Content protection**: bloquea right-click, drag, Ctrl+S/U/P/A, Ctrl+Shift+I

### CSS global

Un solo archivo: `src/styles/global.css` (~2400 líneas). Contiene:

- **Design tokens**: variables CSS en `:root` (colores, radios, easing, fuente)
- **Tipografía**: Morganite (9 pesos, de Thin a Black), cargada como `@font-face`. Body usa `system-ui`
- **Componentes**: estilos de todas las secciones listadas arriba
- **Responsive**: breakpoints en 900px (tablet/móvil) y 480px (teléfonos pequeños)
- **Animaciones**: keyframes para reveal, float, pulse, marquee, shimmer, scroll

### i18n

- **Idiomas**: `es` (default), `en`
- **Archivos**: `src/i18n/{es,en}.ts` + `ui.ts` (helper `t()`)
- **Servidor**: `t()` se usa en Layout.astro para title/meta
- **Cliente**: `window.ui` expuesto via `<script define:vars>` en index.astro. `updateTranslations()` recorre `[data-i18n]` y `[data-i18n-placeholder]`
- **Persistencia**: `localStorage.setItem('ntz-lang', lang)`

---

## Panel de administración

### Login (`/admin/login`)
- SSR (`prerender = false`)
- Si ya tiene cookie válida → redirect a `/admin`
- Formulario simple con username/password
- POST a `/api/admin/login`

### Dashboard (`/admin`)
- Protegido: verifica cookie `admin_token` → redirect a `/admin/login` si inválida
- **Stats**: total conversaciones, mensajes, mensajes hoy, intenciones WhatsApp
- **Gráficos**: Chart.js — actividad diaria (14 días, barras) + keywords frecuentes (barras horizontales)
- **Conversaciones recientes**: 25 sesiones en `<details>` expandibles con preview, fecha, conteo
- **Generador de reportes**: dropdown con selector de período (7d, 30d, 3m, personalizado) → fetch `/api/admin/report` → fetch `/api/export-pdf` → descarga PDF

### Gate de admin (`Ctrl+K` / `Cmd+K`)
- Embebido en `Layout.astro` como modal inline
- Mismo endpoint de login que `/admin/login`

---

## API Endpoints

| Endpoint | Método | SSR | Descripción |
|---|---|---|---|
| `/api/chat` | POST | Sí | Proxy a OpenAI gpt-4o-mini. Guarda intercambios en Turso |
| `/api/admin/login` | POST | Sí | Verifica credenciales, setea cookie `admin_token` |
| `/api/admin/logout` | POST | Sí | Limpia cookie `admin_token` |
| `/api/admin/report` | POST | Sí | Genera HTML del reporte con stats, gráficos SVG inline, resumen |
| `/api/export-pdf` | POST | Sí | Recibe HTML → Puppeteer → PDF. Auto-detecta Chrome local o `@sparticuz/chromium` en serverless |

---

## Base de datos (Turso / libsql)

Dos tablas, creadas automáticamente en `src/lib/db.ts`:

**`admin_users`** — credenciales de administrador
- `username` (UNIQUE), `password_hash` (SHA-256), `created_at`
- Se auto-crea un admin desde `ADMIN_USERNAME`/`ADMIN_PASSWORD` si la tabla está vacía

**`chat_messages`** — historial del chatbot
- `session_id`, `role` (user/bot), `content`, `timestamp`, `date`
- Índices en `session_id` y `date`
- El bot marca intención de venta con `[WA]` en el contenido

---

## Assets (Cloudinary)

Todos los assets se sirven desde Cloudinary. `src/lib/cloudinary.ts` exporta:
- `cld(publicId, opts)` — builder de URLs con transforms
- `ASSETS` — diccionario con todas las URLs precomputadas

Estructura en Cloudinary:
```
naturizable/
  hero/         → plan
  products/     → charola-hero, charola-855, producto, vaso, contenedor
  partners/     → lonely, tom-ford, nu, bbva
  empaque/      → captura, video (mp4)
  parallax/     → fondo, tierra, base-tierra, charola, planta, sello-1/2/3, suiza, suiza-white
charola/
  logo          → SVG del logo (sin f_auto para no rasterizar)
```

El logo es el único asset fuera de la carpeta `naturizable/`.

---

## Flujo de deploy (Netlify)

1. Push a `master`
2. Netlify ejecuta `npm install --legacy-peer-deps && npm run build`
3. Publica `dist/`
4. Las páginas pre-renderizadas son HTML estático; los endpoints SSR corren como Netlify Functions

Variables de entorno requeridas en Netlify: `CLOUDINARY_CLOUD_NAME`, `OPENAI_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `TURSO_URL`, `TURSO_AUTH_TOKEN`.
