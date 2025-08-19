// uno-configs/typography.ts
import { CARBON_FONT_FAMILIES, CARBON_FONT_WEIGHTS, CARBON_SCALE_PX, pxToRem } from './_base'

// Typography shortcuts
export const typographyShortcuts = {
  // Small styles
  caption01: `text-[${pxToRem(CARBON_SCALE_PX[0])}] font-regular leading-[1.33333] tracking-[${pxToRem(0.32)}]`,
  caption02: `text-[${pxToRem(CARBON_SCALE_PX[1])}] font-regular leading-[1.28572] tracking-[${pxToRem(0.32)}]`,
  label01: `text-[${pxToRem(CARBON_SCALE_PX[0])}] font-regular leading-[1.33333] tracking-[${pxToRem(0.32)}]`,
  label02: `text-[${pxToRem(CARBON_SCALE_PX[1])}] font-regular leading-[1.28572] tracking-[${pxToRem(0.16)}]`,
  helperText01: `text-[${pxToRem(CARBON_SCALE_PX[0])}] leading-[1.33333] tracking-[${pxToRem(0.32)}]`,
  helperText02: `text-[${pxToRem(CARBON_SCALE_PX[1])}] leading-[1.28572] tracking-[${pxToRem(0.16)}]`,

  // Body styles
  bodyCompact01: `text-[${pxToRem(CARBON_SCALE_PX[1])}] font-regular leading-[1.28572] tracking-[${pxToRem(0.16)}]`,
  body01: `text-[${pxToRem(CARBON_SCALE_PX[1])}] font-regular leading-[1.42857] tracking-[${pxToRem(0.16)}]`,
  bodyCompact02: `text-[${pxToRem(CARBON_SCALE_PX[2])}] font-regular leading-[1.375] tracking-[0]`,
  body02: `text-[${pxToRem(CARBON_SCALE_PX[2])}] font-regular leading-[1.5] tracking-[0]`,

  // Code styles
  code01: `font-mono text-[${pxToRem(CARBON_SCALE_PX[0])}] font-regular leading-[1.33333] tracking-[${pxToRem(0.32)}]`,
  code02: `font-mono text-[${pxToRem(CARBON_SCALE_PX[1])}] font-regular leading-[1.42857] tracking-[${pxToRem(0.32)}]`,

  // Fixed Heading styles
  heading01: `text-[${pxToRem(CARBON_SCALE_PX[1])}] font-semibold leading-[1.42857] tracking-[${pxToRem(0.16)}]`,
  headingCompact01: `text-[${pxToRem(CARBON_SCALE_PX[1])}] font-semibold leading-[1.28572] tracking-[${pxToRem(0.16)}]`,
  heading02: `text-[${pxToRem(CARBON_SCALE_PX[2])}] font-semibold leading-[1.5] tracking-[0]`,
  headingCompact02: `text-[${pxToRem(CARBON_SCALE_PX[2])}] font-semibold leading-[1.375] tracking-[0]`,
  heading03: `text-[${pxToRem(CARBON_SCALE_PX[4])}] font-regular leading-[1.4] tracking-[0]`,
  heading04: `text-[${pxToRem(CARBON_SCALE_PX[6])}] font-regular leading-[1.28572] tracking-[0]`,
  heading05: `text-[${pxToRem(CARBON_SCALE_PX[7])}] font-regular leading-[1.25] tracking-[0]`,
  heading06: `text-[${pxToRem(CARBON_SCALE_PX[9])}] font-light leading-[1.199] tracking-[0]`,
  heading07: `text-[${pxToRem(CARBON_SCALE_PX[11])}] font-light leading-[1.199] tracking-[0]`,

  // Expressive Heading styles
  expressiveHeading01: `text-[${pxToRem(CARBON_SCALE_PX[1])}] font-semibold leading-[1.25] tracking-[${pxToRem(0.16)}]`,
  expressiveHeading02: `text-[${pxToRem(CARBON_SCALE_PX[2])}] font-semibold leading-[1.5] tracking-[0]`,
  expressiveHeading03: `text-[${pxToRem(CARBON_SCALE_PX[4])}] font-regular leading-[1.4] tracking-[0]`,
  expressiveHeading04: `text-[${pxToRem(CARBON_SCALE_PX[6])}] font-regular leading-[1.28572] tracking-[0]`,
  expressiveHeading05: `text-[${pxToRem(CARBON_SCALE_PX[7])}] font-regular leading-[1.25] tracking-[0]`,
  expressiveHeading06: `text-[${pxToRem(CARBON_SCALE_PX[7])}] font-semibold leading-[1.25] tracking-[0]`,
  expressiveParagraph01: `text-[${pxToRem(CARBON_SCALE_PX[5])}] font-light leading-[1.334] tracking-[0]`,

  // Quotation styles
  quotation01: `font-serif text-[${pxToRem(CARBON_SCALE_PX[4])}] font-regular leading-[1.3] tracking-[0]`,
  quotation02: `font-serif text-[${pxToRem(CARBON_SCALE_PX[7])}] font-light leading-[1.25] tracking-[0]`,

  // Display styles
  display01: `text-[${pxToRem(CARBON_SCALE_PX[9])}] font-light leading-[1.19] tracking-[0]`,
  display02: `text-[${pxToRem(CARBON_SCALE_PX[9])}] font-semibold leading-[1.19] tracking-[0]`,
  display03: `text-[${pxToRem(CARBON_SCALE_PX[9])}] font-light leading-[1.19] tracking-[0]`,
  display04: `text-[${pxToRem(CARBON_SCALE_PX[9])}] font-light leading-[1.19] tracking-[0]`,

  // V11 Aliases
  legal01: 'caption01',
  legal02: 'bodyCompact01',
}

// Typography theme definition
export const typographyTheme = {
  fontFamily: {
    // Mapping Carbon's font families
    'mono': CARBON_FONT_FAMILIES.mono,
    'sans': CARBON_FONT_FAMILIES.sans,
    'sans-condensed': CARBON_FONT_FAMILIES.sansCondensed,
    'sans-hebrew': CARBON_FONT_FAMILIES.sansHebrew,
    'serif': CARBON_FONT_FAMILIES.serif,
  },
  fontWeight: {
    // Explicitly define Carbon's named font weights. UnoCSS typically has these numbers too.
    light: CARBON_FONT_WEIGHTS.light,
    regular: CARBON_FONT_WEIGHTS.regular,
    semibold: CARBON_FONT_WEIGHTS.semibold,
  },
  lineHeight: {
    tight: 1.05,
    snug: 1.11,
    normal: 1.15,
    relaxed: 1.19,
    loose: 1.25,
  },
  letterSpacing: {
    tight: '-0.016rem', // -0.16px
    normal: '0',
    wide: '0.016rem', // 0.16px
  },
}
