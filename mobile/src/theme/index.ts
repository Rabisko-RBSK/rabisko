/**
 * Rabisko design tokens (TS mirror of tailwind.config.js / design/src/colors_and_type.css).
 *
 * Prefer NativeWind classes (`bg-surface`, `rounded-rd-md`, …) in components; use this object
 * only where you need a raw value (StyleSheet, react-navigation options, third-party widgets
 * like react-native-calendars).
 *
 * `radius` is the single source of truth for border radii — anchor = the Cadastro RoleSwitch
 * (12px outer container / 8px inner button). plum (#602C66) is the ONLY selection/activation
 * color. (The legacy `colors.primary`/`colors.gray`/`colors.white`/`colors.black` and the
 * separate `borderRadius` block were removed after F2 — see the checklist.)
 */
export const theme = {
  colors: {
    // brand / surface
    background: '#F8F9FA',
    surface: '#EAE0D5',
    surface2: '#F2EBE0',
    ink: '#000000',
    inkSoft: '#1A1A1A',
    paper: '#FFFFFF',
    hairline: '#D9D9D9',
    // accent — plum is the ONLY selection/activation color
    plum: '#602C66',
    plumDeep: '#4A2150',
    plumTint: '#EFE6F0',
    indigo: '#2C4466',
    steel: '#2E3238',
    // semantic text
    fg2: '#404040',
    fg3: '#6B6B6B',
    onInk: '#FFFFFF',
    success: '#1F7A4D',
    warning: '#B5752A',
    error: '#B33A3A',
  },

  /** 8-point spacing scale (matches Tailwind defaults: space-4 === p-4 === 16px). */
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    // legacy aliases
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  /**
   * Border-radius scale — SINGLE SOURCE OF TRUTH. Never hardcode raw radii.
   *   xs (8)   inner item inside an `md` container — e.g. RoleSwitch buttons (ANCHOR)
   *   sm (10)  micro chips / inline tags
   *   md (12)  DEFAULT — buttons, fields, tabs, role-switch container, most containers
   *   lg (16)  cards, sheets, surface tiles
   *   xl (22)  hero cards, large media tiles
   *   2xl (28) modal sheets, logo blocks
   *   pill     status pills, round icon buttons, segmented full pill
   */
  radius: {
    xs: 8,
    sm: 10,
    md: 12,
    lg: 16,
    xl: 22,
    '2xl': 28,
    pill: 9999,
  },
} as const;
