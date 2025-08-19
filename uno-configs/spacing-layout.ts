// uno-configs/spacing-layout.ts
import { MINI_UNIT, pxToRem } from './_base'

// Defined breakpoints (already present in the original UnoCSS config)
const breakpointsPx = {
  sm: 320, // 320px
  md: 672, // 672px
  lg: 1056, // 1056px
  xlg: 1312, // 1312px
  max: 1584, // 1584px
}

// Convert breakpoints to rem
const breakpointsRem = Object.fromEntries(
  Object.entries(breakpointsPx).map(([key, value]) => [
    key,
    pxToRem(value),
  ]),
)

// Pre-calculate spacing values for clarity
const spacingValues = {
  // spacing
  '01': pxToRem(MINI_UNIT * 0.25), // 2px -> 0.125rem
  '02': pxToRem(MINI_UNIT * 0.5), // 4px -> 0.25rem
  '03': pxToRem(MINI_UNIT * 1), // 8px -> 0.5rem
  '04': pxToRem(MINI_UNIT * 1.5), // 12px -> 0.75rem
  '05': pxToRem(MINI_UNIT * 2), // 16px -> 1rem
  '06': pxToRem(MINI_UNIT * 3), // 24px -> 1.5rem
  '07': pxToRem(MINI_UNIT * 4), // 32px -> 2rem
  '08': pxToRem(MINI_UNIT * 5), // 40px -> 2.5rem
  '09': pxToRem(MINI_UNIT * 6), // 48px -> 3rem
  '10': pxToRem(MINI_UNIT * 8), // 64px -> 4rem
  '11': pxToRem(MINI_UNIT * 10), // 80px -> 5rem
  '12': pxToRem(MINI_UNIT * 12), // 96px -> 6rem
  '13': pxToRem(MINI_UNIT * 20), // 160px -> 10rem

  // Container values
  'container01': pxToRem(MINI_UNIT * 3), // 24px -> 1.5rem
  'container02': pxToRem(MINI_UNIT * 4), // 32px -> 2rem
  'container03': pxToRem(MINI_UNIT * 5), // 40px -> 2.5rem
  'container04': pxToRem(MINI_UNIT * 6), // 48px -> 3rem
  'container05': pxToRem(MINI_UNIT * 8), // 64px -> 4rem

  // Fixed sizes
  'sizeXSmall': pxToRem(24), // 24px -> 1.5rem
  'sizeSmall': pxToRem(32), // 32px -> 2rem
  'sizeMedium': pxToRem(40), // 40px -> 2.5rem
  'sizeLarge': pxToRem(48), // 48px -> 3rem
  'sizeXLarge': pxToRem(64), // 64px -> 4rem
  'size2XLarge': pxToRem(80), // 80px -> 5rem

  // Icon sizes
  'iconSize01': '1rem', // Directly 1rem (16px)
  'iconSize02': '1.25rem', // Directly 1.25rem (20px)
}

export const spacingLayoutTheme = {
  breakpoints: breakpointsRem,
  spacing: {
    1: spacingValues['01'],
    2: spacingValues['02'],
    3: spacingValues['03'],
    4: spacingValues['04'],
    5: spacingValues['05'],
    6: spacingValues['06'],
    7: spacingValues['07'],
    8: spacingValues['08'],
    9: spacingValues['09'],
    10: spacingValues['10'],
    11: spacingValues['11'],
    12: spacingValues['12'],
    13: spacingValues['13'],
  },
  maxWidth: {
    'container-01': spacingValues.container01,
    'container-02': spacingValues.container02,
    'container-03': spacingValues.container03,
    'container-04': spacingValues.container04,
    'container-05': spacingValues.container05,
  },
  widths: {
    'x-small': spacingValues.sizeXSmall,
    'small': spacingValues.sizeSmall,
    'medium': spacingValues.sizeMedium,
    'large': spacingValues.sizeLarge,
    'x-large': spacingValues.sizeXLarge,
    '2x-large': spacingValues.size2XLarge,
  },
  heights: {
    'x-small': spacingValues.sizeXSmall,
    'small': spacingValues.sizeSmall,
    'medium': spacingValues.sizeMedium,
    'large': spacingValues.sizeLarge,
    'x-large': spacingValues.sizeXLarge,
    '2x-large': spacingValues.size2XLarge,
  },
  iconSizes: {
    1: spacingValues.iconSize01,
    2: spacingValues.iconSize02,
  },
}
