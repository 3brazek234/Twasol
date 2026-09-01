// ─────────────────────────────────────────────────────────────────────────────
// Wakeel / وكيل — Visual Identity Token System
// Phase 3: Full Brand Token Set — Traditional/Formal Legal Marketplace
//
// Design principles:
//  1. Authority through restraint — deep navy is the primary voice; muted gold
//     is used sparingly as the accent that signals agreement and credibility.
//  2. Warmth over sterility — backgrounds are warm off-white, not clinical white.
//  3. Generous whitespace — hierarchy is expressed through space, not decoration.
//  4. Serif display, sans body — classical signal at the top, readable below.
//  5. Bilingual by design — every font role has an Arabic equivalent of matching
//     weight and formality. Neither language is an afterthought.
//
// Mirror all color tokens in tailwind.config.js under theme.extend.colors.
// Use NativeWind classNames for layout/spacing; import tokens directly for
// computed styles, animations, and conditional dark/light assignments.
// ─────────────────────────────────────────────────────────────────────────────


// ─── Color Palette ────────────────────────────────────────────────────────────
//
// Naming convention:
//   ink      → primary text / darkest surface
//   paper    → primary background / lightest surface
//   navy     → brand primary (replaces teal "signal")
//   gold     → brand accent (restrained; agreements, emphasis, active states)
//   line     → dividers, borders
//   muted    → secondary / placeholder text
//   seal     → the circular seal mark color (deep navy — same as navy)
//
// Status colors are intentionally muted — formal, not alarming:
//   amber    → pending / attention (warm, not electric)
//   verdant  → success / agreed (deep forest green)
//   crimson  → error / destructive (dark burgundy, not bright red)
//   slate    → neutral info

export const colors = {
  // ── Core ──────────────────────────────────────────────────────────────────
  ink:        '#1C2333',    // Near-black with slight blue undertone — richer than pure #000
  paper:      '#F7F5F0',    // Warm off-white — professional stationery, not hospital white
  white:      '#FFFFFF',    // True white for cards/modals that need to pop off paper
  navy:       '#1B2A4A',    // Deep authoritative navy — the Wakeel primary brand color
  navyLight:  '#2D4170',    // Lighter navy for hover/active states on dark surfaces
  gold:       '#C9A96E',    // Muted antique gold — the accent; use sparingly
  goldLight:  '#E8D5A3',    // Pale gold for tinted backgrounds (e.g., active pill bg)

  // ── Layout ─────────────────────────────────────────────────────────────────
  line:       '#DDD9D0',    // Warm gray divider — matches the paper undertone
  surface:    '#ECEAE4',    // Slightly darker than paper for inset sections/cards
  muted:      '#6B7280',    // Secondary text — neutral, professional

  // ── Status ─────────────────────────────────────────────────────────────────
  // Pending / Attention — warm amber, not electric yellow
  amber:      '#B07D3A',    // Amber text / icon
  amberBg:    '#F5EDD9',    // Amber background tint

  // Success / Agreed — deep forest green
  verdant:    '#2D6A4F',    // Verdant text / icon
  verdantBg:  '#D8EDDF',    // Verdant background tint

  // Error / Destructive — dark burgundy
  crimson:    '#8B2635',    // Crimson text / icon
  crimsonBg:  '#F5D9DC',    // Crimson background tint

  // Info / Neutral — cool slate
  slate:      '#3D5A80',    // Slate text / icon
  slateBg:    '#D9E4F0',    // Slate background tint

  // ── Semantic aliases (used by existing components) ─────────────────────────
  // Mapped to new palette so old className references still resolve correctly
  signal:     '#1B2A4A',    // was teal, now maps to navy (primary CTA color)
  docket:     '#B07D3A',    // was warm amber, still amber (error/attention)
  destructive:'#8B2635',
  success:    '#2D6A4F',
  info:       '#3D5A80',
  warning:    '#B07D3A',
  warningText:'#5C3D0A',
} as const;

// ─── Dark Mode Palette ────────────────────────────────────────────────────────
//
// "Traditional/formal in dark mode" — a deep charcoal chamber, not a void.
// Text is warm off-white; accents are the same gold, slightly brightened for
// readability against dark; surfaces step up from near-black in warm increments.

export const darkColors = {
  // ── Core ──────────────────────────────────────────────────────────────────
  ink:        '#EDE9E0',    // Warm off-white text — not cold #FFF
  paper:      '#151A24',    // Deep charcoal-navy background
  white:      '#1C2333',    // Inverted — cards appear as navy on charcoal
  navy:       '#4A6FA5',    // Lightened navy for legibility on dark bg
  navyLight:  '#6B8FC2',    // Lighter for active states
  gold:       '#D4B07A',    // Gold brightened slightly for dark surfaces
  goldLight:  '#3D3020',    // Dark tint for gold-bg elements

  // ── Layout ─────────────────────────────────────────────────────────────────
  line:       '#2A3347',    // Subtle warm-dark divider
  surface:    '#1F2A3C',    // Raised surface (cards) above paper
  muted:      '#8B97A8',    // Muted text — lighter on dark bg

  // ── Status ─────────────────────────────────────────────────────────────────
  amber:      '#D4943F',
  amberBg:    '#2C2010',
  verdant:    '#4A9B6F',
  verdantBg:  '#0D2418',
  crimson:    '#C94F5C',
  crimsonBg:  '#2C0D12',
  slate:      '#6B9AC4',
  slateBg:    '#0D1C2C',

  // ── Semantic aliases ────────────────────────────────────────────────────────
  signal:     '#4A6FA5',
  docket:     '#D4943F',
  destructive:'#C94F5C',
  success:    '#4A9B6F',
  info:       '#6B9AC4',
  warning:    '#D4943F',
  warningText:'#F5DDB0',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
//
// Display (headers): EB Garamond — a contemporary, humanist old-style serif.
//   Classical gravitas without the stiffness of Times or the trendiness of Playfair.
//   Used for large display, section headers, and the brand wordmark in-app.
//   Arabic equivalent: Noto Serif Arabic — the only widely-available Arabic serif
//   that pairs acceptably with a classical Latin serif. Formal, legible, matching weight.
//
// Body: Inter (EN) / IBM Plex Sans Arabic (AR) — unchanged; both are workhorses
//   for UI at all sizes. Inter feels more neutral/professional under a serif display
//   than it did next to Fraunces (which competed for attention).
//
// Mono: IBM Plex Mono — unchanged; salary figures, case numbers, dates. Numerals
//   feel precise and authoritative in a monospaced face.

export const fonts = {
  get display() {
    return 'Amiri_400Regular';
  },
  get displayBold() {
    return 'Amiri_700Bold';
  },
  get body() {
    return 'Cairo_400Regular';
  },
  get bodyMedium() {
    return 'Cairo_500Medium';
  },
  get bodySemibold() {
    return 'Cairo_600SemiBold';
  },
  get mono() {
    return 'IBMPlexMono_500Medium';
  },
} as const;

// ─── Spacing Scale ────────────────────────────────────────────────────────────
// Unchanged — the spacing scale was already generous and professional.
// Formal design uses the larger end of this scale (lg, xl, xxl) more liberally.

export const spacing = {
  xxs: 4,
  xs:  8,
  sm:  12,
  md:  16,
  lg:  24,
  xl:  32,
  '2xl': 48,
  xxl: 48,
  xxxl: 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
// Reduced vs. Tawasol — formal design uses tighter radii.
// Pill is preserved for status badges only.

export const radius = {
  xs:   2,    // was 4 — subtle, formal
  sm:   4,    // was 8
  md:   8,    // was 12
  lg:   12,   // was 16 — cards, modals
  xl:   16,   // was 24 — bottom sheets
  pill: 999,  // status pills only
} as const;

// ─── Elevation / Shadows ──────────────────────────────────────────────────────
// More restrained than Tawasol — formal surfaces don't float dramatically.
// Shadow color uses navy, not pure black, to stay warm.

export const shadows = {
  sm: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ─── Type Scale ───────────────────────────────────────────────────────────────
// Slightly larger line heights than Tawasol — formal typography breathes.

export const typeScale = {
  display:      { fontSize: 32, lineHeight: 42, fontFamily: fonts.displayBold },
  h2:           { fontSize: 24, lineHeight: 32, fontFamily: fonts.display },
  h3:           { fontSize: 20, lineHeight: 28, fontFamily: fonts.display },
  body:         { fontSize: 16, lineHeight: 26, fontFamily: fonts.body },
  bodyMedium:   { fontSize: 16, lineHeight: 26, fontFamily: fonts.bodyMedium },
  bodySemibold: { fontSize: 16, lineHeight: 26, fontFamily: fonts.bodySemibold },
  caption:      { fontSize: 13, lineHeight: 19, fontFamily: fonts.body, color: colors.muted },
  label:        { fontSize: 11, lineHeight: 14, fontFamily: fonts.bodySemibold, letterSpacing: 0.8 },
  mono:         { fontSize: 14, lineHeight: 20, fontFamily: fonts.mono },
  monoLarge:    { fontSize: 24, lineHeight: 30, fontFamily: fonts.mono },
} as const;

// ─── Offer Card Design Tokens ─────────────────────────────────────────────────
// The Offer Card is Wakeel's signature interaction — two lawyers agreeing on
// a fee inside a chat. Under the formal system:
//   - More structure, less color play
//   - Numerals right-aligned in mono, confident
//   - Status expressed through muted status colors, not bright highlights
//   - A thin top border in gold signals "this is not a message, it is a document"

export const offerCard = {
  borderAccent:    colors.gold,         // Top border that distinguishes it from chat
  borderAccentDark: darkColors.gold,
  pendingBg:       colors.amberBg,
  pendingText:     colors.amber,
  agreedBg:        colors.verdantBg,
  agreedText:      colors.verdant,
  rejectedBg:      colors.crimsonBg,
  rejectedText:    colors.crimson,
  amountColor:     colors.navy,         // The fee figure — authoritative navy
  amountColorDark: darkColors.navy,
  cardRadius:      radius.md,           // Tighter than before — formal, document-like
  borderWidth:     3,                   // Top accent border width
} as const;

// ─── Brand Identity ───────────────────────────────────────────────────────────
// Central reference for brand identity assets referenced across the app.

export const brand = {
  name:     'Wakeel',
  nameAr:   'وكيل',
  tagline:  'Professional Legal Network',
  taglineAr:'شبكة المحامين المهنية',
  primary:  colors.navy,
  accent:   colors.gold,
} as const;

// ─── Backward Compatibility Layer ────────────────────────────────────────────
// Preserves the `tokens.X` import pattern used throughout the codebase.

export const tokens = {
  colors,
  darkColors,
  fonts,
  spacing,
  radius,
  shadows,
  typeScale,
  offerCard,
  brand,
  typography: {
    fonts: {
      display:      fonts.display,
      displayBold:  fonts.displayBold,
      body:         fonts.body,
      bodyMedium:   fonts.bodyMedium,
      bodySemibold: fonts.bodySemibold,
      mono:         fonts.mono,
    },
    sizes: {
      xs:   12,
      sm:   14,
      base: 16,
      lg:   18,
      xl:   20,
      xxl:  24,
      xxxl: 32,
    },
    weights: {
      regular:  '400' as const,
      medium:   '500' as const,
      semibold: '600' as const,
      bold:     '700' as const,
    },
  },
};

export type Tokens = typeof tokens;
