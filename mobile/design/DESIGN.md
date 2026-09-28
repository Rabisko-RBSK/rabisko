# Rabisko — Design System

> Reference document for engineering implementation. Every value here is a hard contract: do not invent new tokens or hardcode raw values. If something seems missing, add it to this document first, then code it.

---

## 1. Brand identity

**Rabisko** is a tattoo-booking marketplace connecting clients, artists, and studios in Brazil. The visual language is **editorial-print** crossed with **streetwear-zine**: high contrast, large display type, cream surfaces, restrained accents. References lean closer to *Vogue Italia* and indie risograph zines than to typical SaaS apps.

**Pillars**
- High contrast (black ink on cream / off-white)
- A single warm purple as the sole accent
- Generous negative space; near-zero elevation
- Display typography does heavy lifting — minimal iconography decoration

---

## 2. Color palette

### 2.1 Brand & surfaces

| Token | Hex | Use |
|---|---|---|
| `--rbk-bg` | `#F8F9FA` | App background (off-white) |
| `--rbk-surface` | `#EAE0D5` | **Warm cream** — primary card / bottom nav surface |
| `--rbk-surface-2` | `#F2EBE0` | Lighter cream for nested cards |
| `--rbk-paper` | `#FFFFFF` | Pure white surface (inputs, modals) |
| `--rbk-ink` | `#000000` | Primary text, primary CTA fill, icons |
| `--rbk-ink-soft` | `#1A1A1A` | Hover / pressed state of ink |
| `--rbk-hairline` | `#D9D9D9` | Dividers, disabled borders |

### 2.2 Accent — the purple

| Token | Hex | Use |
|---|---|---|
| `--rbk-plum` | `#602C66` | **Primary accent.** Selected states, active tab indicator, success checkmark, "Pago" pill |
| `--rbk-plum-deep` | `#4A2150` | Hover state for plum |
| `--rbk-plum-tint` | `#EFE6F0` | Selected day halo, very light plum fills |
| `--rbk-indigo` | `#2C4466` | Secondary accent (used rarely) |
| `--rbk-steel` | `#2E3238` | Near-black neutral (very rare) |

> **Rule:** plum is the *only* color allowed to indicate selection / activation across the app. Never use blue, green, or red for that purpose.

### 2.3 Semantic text

| Token | Hex | Use |
|---|---|---|
| `--rbk-fg-1` | `#000000` | Primary text |
| `--rbk-fg-2` | `#404040` | Secondary text, subtitles |
| `--rbk-fg-3` | `#6B6B6B` | Muted / timestamps / captions |
| `--rbk-on-ink` | `#FFFFFF` | Text on black surfaces |
| `--rbk-success` | `#1F7A4D` | Success states only (rare) |
| `--rbk-warning` | `#B5752A` | Warning states only |
| `--rbk-error` | `#B33A3A` | Errors only |

---

## 3. Typography

### 3.1 Families

| Token | Family | Use |
|---|---|---|
| `--font-display` | **Bebas Neue** | Logo, screen titles, eyebrow labels — anything that should feel like a poster |
| `--font-body` | **Inter** | Default UI body text, buttons, labels |
| `--font-aux` | **DM Sans** | Names (H1), section headings (H3) — slightly warmer than Inter |
| `--font-mono` | system mono stack | Code / numerical confirmation IDs only |

### 3.2 Type scale

| Token | Spec | Use |
|---|---|---|
| `--t-display-xl` | 700 64/1 Bebas | "RABISKO" logo |
| `--t-display-lg` | 400 32/1 Bebas | Screen titles ("Reserva Confirmada") |
| `--t-display-md` | 400 20/1 Bebas | Card eyebrow, section labels |
| `--t-display-sm` | 400 16/1 Bebas | Small overlines |
| `--t-h1` | 700 32/1.1 DM Sans | Artist names, hero |
| `--t-h2` | 700 24/1.2 Inter | Page subhead |
| `--t-h3` | 700 20/1.2 DM Sans | Section heading ("Sobre", "Portfolio") |
| `--t-h4` | 600 16/1.25 Inter | Card title |
| `--t-body-lg` | 400 16/1.4 Inter | Default body |
| `--t-body` | 400 14/1.4 Inter | Secondary body / subtitle |
| `--t-body-sm` | 400 12/1.4 Inter | Labels, helper text |
| `--t-caption` | 300 11/1.3 Inter | Timestamps |
| `--t-micro` | 400 10/1.3 Inter | Review body, footnotes |
| `--t-button` | 700 20/1 Inter | Primary CTA label |
| `--t-button-sm` | 500 12/1 Inter | Chip label |

**Rules**
- Display type should always have `letter-spacing: .01em–.04em` — Bebas reads tight otherwise.
- Body type defaults to `line-height: 1.4`. Never override to less than 1.2.
- All copy is in **Brazilian Portuguese**.

---

## 4. Spacing scale

8-point grid. Always reference tokens, never raw px.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

**Patterns**
- Screen padding (left/right): `--space-6` (24px)
- Top of screen (under status bar): `--space-12` (48px) ≈ 68px in practice with status bar
- Card padding: `--space-4`–`--space-5`
- Gap between stacked cards: `--space-3` (12px)
- Bottom nav height: 80px reserved

---

## 5. Border radius — single source of truth

**Anchor:** the Role selector (Cliente / Artista / Estúdio) in Cadastro is the canonical shape. Outer container = 12px, inner button = 8px. All other radii scale from that beat.

| Token | Value | Use |
|---|---|---|
| `--rbk-r-xs` | 8px | Inner item nested in an `md` container (12 − 4 padding) |
| `--rbk-r-sm` | 10px | Micro chips, inline tags |
| **`--rbk-r-md`** | **12px** | **DEFAULT — buttons, fields, role-switch, tabs, most containers** |
| `--rbk-r-lg` | 16px | Cards, sheets, surface tiles |
| `--rbk-r-xl` | 22px | Hero cards, large media tiles |
| `--rbk-r-2xl` | 28px | Modal sheets, logo blocks |
| `--rbk-r-pill` | 999px | Status pills, round icon buttons, segmented full pill |

> **Never hardcode `borderRadius: 16` or any other number.** Always reference a token.

---

## 6. Elevation / shadow

The system is **flat by default**. Surfaces sit on the page without elevation.

| Token | Value |
|---|---|
| `--sh-0` | `none` (default) |
| `--sh-1` | `0 1px 2px rgba(0,0,0,.04)` — subtle hairline shadow |
| `--sh-2` | `0 6px 18px rgba(0,0,0,.08)` — lifted card / modal |

Use shadow sparingly — only for genuinely floating elements (bottom sheets, modals, FABs).

---

## 7. Motion

### 7.1 Easing

| Token | Curve |
|---|---|
| `--ease-out` | `cubic-bezier(.2,.7,.2,1)` |
| `--ease-in` | `cubic-bezier(.6,0,.8,.2)` |
| `--ease-spring` | `cubic-bezier(.2,.9,.25,1.2)` — slight overshoot (sheets, pops) |

### 7.2 Duration

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 120ms | Press feedback, hover |
| `--dur-med` | 220ms | Standard transitions |
| `--dur-slow` | 360ms | Sheet mount, screen enter |

### 7.3 Patterns

- **Screen enter**: `fadeUp` (10px → 0, opacity 0 → 1) with `--ease-out --dur-med`. Frame re-keys on screen change so this replays on every nav.
- **Press feedback**: `scale(.97)` on `:active` for every button.
- **Tab active indicator**: animated underline pill (`width 0 → 18px`, `--ease-spring`).
- **Success confirmation**: check pops with spring + two expanding rings (see ConfirmedScreen).
- **Favorite toggle**: heart pops with `rbkPop` keyframe.
- **List stagger**: `.rbk-stagger > *:nth-child(n)` cascades fade-up delays (30ms beat).
- **Reduced motion**: all animations disabled under `prefers-reduced-motion: reduce`.

---

## 8. Components

### 8.1 Frame
- 402 × 874 px fixed canvas (iPhone-class)
- Outer radius `48px` (device bezel illusion)
- Inner content positioned absolute, `overflow: hidden`
- Bottom nav reserved at 80px when `hideNav={false}`
- Wraps content in a keyed div so screen transitions re-trigger animation

### 8.2 BottomNav
- Cream surface (`--rbk-surface`), 80px tall, 4 tabs
- Icons: `boxicons:home-filled`, `majesticons:chat`, `solar:calendar-bold`, `solar:settings-bold` at 40px
- Active tab: plum tint + animated underline pill below icon
- Active icon scales `1.12` with spring

### 8.3 Buttons

| Variant | Spec |
|---|---|
| **Primary** | `background: --rbk-ink`, `color: --rbk-on-ink`, `borderRadius: --rbk-r-md`, `padding: 14px 24px`, font `--t-button` |
| **Secondary** | `background: transparent`, `border: 1px solid --rbk-hairline`, ink text, same radius |
| **Plum CTA** | `background: --rbk-plum`, `color: #fff` — used for AI/premium actions |
| **Small** | Half-height variant (10px vertical pad), `--t-button-sm` |
| **Ghost / link** | No background, ink text, font `700 14px Inter` |

All buttons scale to `.97` on press. Full-width buttons use `width: 100%`.

### 8.4 Fields
- White paper background OR cream depending on context
- Border `1px solid --rbk-hairline`
- Radius `--rbk-r-md` (12px)
- Padding `12px 14px`
- Label sits above (`--t-body-sm`, color `--rbk-fg-2`)
- Focus: border becomes plum

### 8.5 Chips

| Variant | Spec |
|---|---|
| **FilterChip** | Pill (`--rbk-r-pill`), 10×14 padding, ink text on cream — selected = ink bg + white text |
| **PrefChip** | Same as filter but smaller, used inside cards |
| **StatusPill** | Pill, semantic tone (`plum`, `success`, `warn`) — used for "Pago", "Aguardando", etc. |

### 8.6 ArtistCard
- Black hero block, `--rbk-r-xl` (22px) radius
- Cream footer strip with name + style tags
- Rating + heart overlay top-right
- Click → goes to ArtistScreen

### 8.7 Stepper
- 4-step indicator (Artista · Data · Pagamento · Concluído)
- Bar fills with plum as user progresses
- Sits at top of Booking, Payment, Confirmed

### 8.8 CalendarMini
- 7-column grid, current month
- Selected day: plum tint halo + plum text
- Today: bold underline
- Disabled days: `--rbk-fg-3` color

### 8.9 RoleSwitch (Cliente / Artista / Estúdio)
- Cream container at `--rbk-r-md`, 4px padding
- Three buttons at `--rbk-r-xs` (8px), grid 1fr 1fr 1fr
- Selected: ink fill + white text
- **This is the canonical curvature pattern — match it for any segmented control.**

---

## 9. Iconography

- **Library:** Iconify (`iconify-icon` web component)
- **Default size:** 24px in body, 40px in nav
- **Color:** inherits `currentColor` — use text color, never apply fills directly
- **Preferred packs:** `boxicons`, `majesticons`, `solar`, `material-symbols`, `ph` — keep consistent within a screen

**Never** mix line and filled variants on the same screen.

---

## 10. Screen catalog

18 screens make up the short-term MVP scope (from TCC document):

| # | Screen | Role | Purpose |
|---|---|---|---|
| 01 | Landing | All | Entry — "Entrar" / "Criar conta" |
| 02 | Login | All | Email/senha + role selector |
| 02b | Cadastro | All | Role-aware signup (Cliente / Artista / Estúdio) |
| 03 | Home | Cliente | Discover artists — search, filters, favorites, "Flash do dia" |
| 04 | Artist Profile | Cliente | Portfolio, about, booking CTA |
| 05 | Booking | Cliente | Date + time picker (Stepper 1/4 → 2/4) |
| 06 | Payment | Cliente | Pix/card (Stepper 3/4) |
| 06b | Confirmed | Cliente | Success state (Stepper 4/4) — animated check |
| 07 | Simulador | Cliente | AR-style preview of design on body part |
| 08 | Chat | Both | Message thread + image attachments |
| 09 | Calendar | Cliente | Upcoming appointments list |
| 09b | Session Detail | Cliente | Single appointment — open chat / check-in |
| 10 | Check-in | Cliente | QR code to present at studio |
| 10b | Scanner | Studio | Scan client's QR (artist/studio role) |
| 11 | Healing | Cliente | Post-tattoo healing timeline |
| 12 | Rating | Cliente | Star + comment after session |
| 13 | Dashboard | Artist/Studio | Bookings overview, revenue |
| 14 | Settings | All | Profile, notifications, sign out |

---

## 11. Engineering rules

1. **Tokens only.** Every color, radius, spacing, font references a CSS var. Hardcoded values are bugs.
2. **Mobile-first 402px frame.** Design canvas is 402×874. Never assume more width.
3. **Brazilian Portuguese copy.** All UI strings, dates, currency (R$).
4. **Accessibility:** every interactive element ≥44px tap target; respect `prefers-reduced-motion`; semantic HTML.
5. **No emoji** unless explicitly approved.
6. **No drop shadows on flat surfaces.** Use hairlines or background contrast instead.
7. **State persistence:** favorites use `localStorage` under `rbk:favorites`.
8. **Plum is sacred.** Never substitute another accent color.

---

## 12. File structure (current prototype)

```
colors_and_type.css         ← all tokens
ui_kits/mobile-app/
  index.html                ← React shell + sidebar nav
  export.html               ← PNG + HTML export utility
  motion.css                ← keyframes + utilities
  components/
    Frame.jsx               ← 402×874 device-style frame
    BottomNav.jsx           ← 4-tab cream nav
    Header.jsx              ← back arrow + title
    Button.jsx              ← Button + SmallButton
    Field.jsx               ← Input fields
    Chip.jsx                ← FilterChip, PrefChip, StatusPill
    ArtistCard.jsx          ← Hero card with favorite
    CalendarMini.jsx        ← Month grid
    Stepper.jsx             ← 4-step booking progress
    Favorites.jsx           ← localStorage hook
    Screens.jsx             ← Landing / Login / Cadastro / Home / Artist / Booking / Payment / Confirmed / Chat / Calendar / Settings
    MoreScreens.jsx         ← Checkin / Scanner / Post / Rating / Dashboard
    SessionFlow.jsx         ← Session detail
    BiskoAI.jsx             ← Simulador
    ChatV2.jsx              ← Chat with attachments
```

For production: port to Next.js or React Native. The CSS tokens map 1:1 to a Tailwind config or theme object.

## 13. Dashboard do Estúdio

A tela do Estúdio usa a referência visual aprovada para a issue #93. Os tokens
específicos ficam em `src/theme/studioDashboard.ts`, sem alterar as telas atuais:

| Token | Valor | Uso |
|---|---|---|
| background | #F1EBE4 | Fundo bege |
| card | #FFFFFF | Cards |
| text | #1C1917 | Texto principal |
| muted | #7A7570 | Texto secundário |
| purple | #5B2368 | Gráfico, seleção e indicadores |
| tint | #F5EEF7 | Indicadores e avatares |
| soft | #F8F6F4 | Linhas de tatuadores e trilhas |
| line | #F1ECE7 | Divisórias e grade |
| radius.card | 26px | Cards |

Inter reutiliza as fontes já carregadas no app. Cards brancos têm sombra suave
`0 4px 20px -2px rgba(28,25,23,0.05)`. Margens laterais: 16px; intervalo: 16px;
cards: 20px de padding; indicadores: 16px. A navegação usa o componente
`BottomNav` existente, sem alterações visuais: fundo cream, ícones e indicador
de seleção plum, animação e safe area. Apenas os destinos e labels correspondem
às abas do Estúdio. O ícone de Dashboard acompanha o de Gestão do tatuador.

Em larguras inferiores a 360px ou com fonte ampliada acima de 120%, indicadores
ficam empilhados. A página tem largura máxima de 560px e rolagem vertical, com
um único gráfico principal. A miniatura de receita é decorativa.

### Dados da primeira versão

O indicador “Demonstração” identifica os valores fictícios. Nomes e IDs de
tatuadores e o catálogo de estilos vêm de `supabase/seed.sql`; nenhum dado é
consultado ou escrito no banco. Valores, datas e reservas são simulados.
O modelo de demonstração considera uma reserva por serviço. Receita é o valor
contratado, excluindo cancelamentos; não representa caixa ou pagamentos.
Novos/recorrentes classifica agendamentos, e não clientes únicos. A média usa
os dias transcorridos no mês atual e todos os dias do mês anterior.

Ainda falta um endpoint autenticado do estúdio para substituir a fonte de dados.
Na integração, filtrar pelo estúdio do usuário, agregar serviços sem duplicar
valores por sessão e definir a relação de serviço com estilo (ausente no schema).
Equipe e agenda desta versão consultam o mesmo conjunto de demonstração.

### Validação

- `npm run test:studio` (Node.js 22.18 ou superior): cálculos, cancelamentos,
  meses curtos, virada de ano e períodos vazios.
- `npx tsc --noEmit` e `npm run lint` com as dependências do mobile instaladas.
- Conferir no Expo: perfil Estúdio, seleção dos dois meses, “Ver todos”, abas,
  voltar, fechamento de modais, logout, 320/360/390/430px e fonte ampliada.
- Conferir que Cliente e Tatuador mantêm a navegação anterior.

