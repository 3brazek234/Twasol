/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Core ──────────────────────────────────────────────────────
        ink:         '#1C2333',
        paper:       '#F7F5F0',
        white:       '#FFFFFF',
        navy:        '#1B2A4A',
        navyLight:   '#2D4170',
        gold:        '#C9A96E',
        goldLight:   '#E8D5A3',

        // ── Layout ────────────────────────────────────────────────────
        line:        '#DDD9D0',
        surface:     '#ECEAE4',
        muted:       '#6B7280',

        // ── Status ────────────────────────────────────────────────────
        amber:       '#B07D3A',
        amberBg:     '#F5EDD9',
        verdant:     '#2D6A4F',
        verdantBg:   '#D8EDDF',
        crimson:     '#8B2635',
        crimsonBg:   '#F5D9DC',
        slate:       '#3D5A80',
        slateBg:     '#D9E4F0',

        // ── Semantic aliases (backward compatibility) ──────────────────
        signal:      '#1B2A4A',   // navy
        docket:      '#B07D3A',   // amber
        destructive: '#8B2635',
        success:     '#2D6A4F',
        info:        '#3D5A80',
        warning:     '#B07D3A',
      },
      fontFamily: {
        // English — EB Garamond serif display + Inter sans body
        display:         ['EBGaramond_600SemiBold', 'serif'],
        displayBold:     ['EBGaramond_700Bold', 'serif'],
        body:            ['Inter_400Regular', 'sans-serif'],
        bodyMedium:      ['Inter_500Medium', 'sans-serif'],
        bodySemibold:    ['Inter_600SemiBold', 'sans-serif'],
        mono:            ['IBMPlexMono_500Medium', 'monospace'],

        // Arabic — Amiri (classical Naskh display) + IBM Plex Sans Arabic (body)
        displayAr:       ['Amiri_400Regular', 'serif'],
        displayBoldAr:   ['Amiri_700Bold', 'serif'],
        bodyAr:          ['Cairo_400Regular', 'sans-serif'],
        bodyMediumAr:    ['Cairo_500Medium', 'sans-serif'],
        bodySemiboldAr:  ['Cairo_600SemiBold', 'sans-serif'],
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
    },
  },
  plugins: [],
};