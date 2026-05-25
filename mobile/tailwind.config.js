/** @type {import('tailwindcss').Config} */

/*
 * Rabisko design tokens — source of truth: design/src/colors_and_type.css + design/DESIGN.md.
 *
 * BORDER RADIUS — single source of truth (F1 in design/IMPLEMENTATION-CHECKLIST.md).
 *   Anchor: the Role selector (Cliente/Artista/Estúdio) in Cadastro = 12px outer container,
 *   8px inner button (12 − 4 padding). Every other radius scales from that beat.
 *   Use the `rounded-rd-*` classes below — NEVER hardcode `rounded-[24px]`, `rounded-2xl`,
 *   `rounded-full`, etc. (`rounded-rd-pill` is the only "fully round" value.)
 *   The `rd-` prefix avoids collision with Tailwind's `rounded-r-*` directional modifier
 *   (which would apply radius to right corners only).
 *
 * COLORS — use the semantic tokens below (`bg-surface`, `text-ink`, `bg-plum`, …).
 *   plum (#602C66) is the ONLY color allowed to indicate selection / activation — never
 *   green/red/blue for that. (The old `primary` cream ramp + `card`/`text`/`muted`/
 *   `secondary` keys were removed after migration — see F2 in the checklist.)
 */

// Type families — must match the keys passed to useFonts() in App.tsx.
// RN has no font-weight synthesis for custom fonts: each weight is its own family.
const fontFamily = {
  display: ['BebasNeue_400Regular'],          // --font-display — logo, screen titles, eyebrows
  body: ['Inter_400Regular'],                 // --font-body — default UI text
  'body-light': ['Inter_300Light'],
  'body-italic': ['Inter_400Regular_Italic'], // editorial accent (e.g. Home "perto de")
  'body-medium': ['Inter_500Medium'],
  'body-semibold': ['Inter_600SemiBold'],
  'body-bold': ['Inter_700Bold'],             // --t-button, --t-h2/h3 weight
  'body-extrabold': ['Inter_800ExtraBold'],
  aux: ['DMSans_400Regular'],                 // --font-aux — warmer than Inter
  'aux-bold': ['DMSans_700Bold'],             // --t-h1 (names), --t-h3 (section headings)
};

const radius = {
  'rd-xs': '8px',      // inner item nested in an `rd-md` container (e.g. RoleSwitch buttons)
  'rd-sm': '10px',     // micro chips, inline tags
  'rd-md': '12px',     // DEFAULT — buttons, fields, tabs, role-switch container, most containers
  'rd-lg': '16px',     // cards, sheets, surface tiles
  'rd-xl': '22px',     // hero cards, large media tiles
  'rd-2xl': '28px',    // modal sheets, logo blocks
  'rd-pill': '9999px', // status pills, round icon buttons, segmented full pill
};

const colors = {
  // brand / surface
  background: '#F8F9FA',   // app background (off-white)
  surface: '#EAE0D5',      // warm cream — primary card / bottom-nav surface
  'surface-2': '#F2EBE0',  // lighter cream for nested cards
  ink: '#000000',          // primary text, primary CTA fill, icons
  'ink-soft': '#1A1A1A',   // hover / pressed ink
  paper: '#FFFFFF',        // pure white surface (inputs over white, modals)
  hairline: '#D9D9D9',     // dividers, disabled borders
  // accent — plum is the ONLY selection/activation color
  plum: '#602C66',
  'plum-deep': '#4A2150',
  'plum-tint': '#EFE6F0',
  indigo: '#2C4466',       // secondary accent (rare)
  steel: '#2E3238',        // near-black neutral (very rare)
  // semantic text
  'fg-2': '#404040',       // secondary text / subtitles
  'fg-3': '#6B6B6B',       // muted / timestamps / captions
  'on-ink': '#FFFFFF',     // text on black surfaces
  success: '#1F7A4D',
  warning: '#B5752A',
  error: '#B33A3A',
};

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./App.{js,jsx,ts,tsx}", "./index.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      borderRadius: radius,
      fontFamily,
    },
  },
  plugins: [],
}
