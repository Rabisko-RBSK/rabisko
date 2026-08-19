/** @type {import('tailwindcss').Config} */


const fontFamily = {
  display: ['BebasNeue_400Regular'],
  body: ['Inter_400Regular'],
  'body-light': ['Inter_300Light'],
  'body-italic': ['Inter_400Regular_Italic'],
  'body-medium': ['Inter_500Medium'],
  'body-semibold': ['Inter_600SemiBold'],
  'body-bold': ['Inter_700Bold'],
  'body-extrabold': ['Inter_800ExtraBold'],
  aux: ['DMSans_400Regular'],
  'aux-bold': ['DMSans_700Bold'],
};

const radius = {
  'rd-xs': '8px',
  'rd-sm': '10px',
  'rd-md': '12px',
  'rd-lg': '16px',
  'rd-xl': '22px',
  'rd-2xl': '28px',
  'rd-pill': '9999px',
};

const colors = {
  background: '#F8F9FA',
  surface: '#EAE0D5',
  'surface-2': '#F2EBE0',
  ink: '#000000',
  'ink-soft': '#1A1A1A',
  paper: '#FFFFFF',
  hairline: '#D9D9D9',
  plum: '#602C66',
  'plum-deep': '#4A2150',
  'plum-tint': '#EFE6F0',
  indigo: '#2C4466',
  steel: '#2E3238',
  'fg-2': '#404040',
  'fg-3': '#6B6B6B',
  'on-ink': '#FFFFFF',
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
