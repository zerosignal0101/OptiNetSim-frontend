// uno-configs/_base.ts

export const MINI_UNIT = 8
export const BASE_FONT_SIZE = 16

/**
 * Carbon's pre-calculated type scale values in pixels.
 * Corresponds to `packages/type/src/scale.js -> scale`
 */
export const CARBON_SCALE_PX = [
  12,
  14,
  16,
  18,
  20,
  24,
  28,
  32,
  36,
  42,
  48,
  54,
  60,
  68,
  76,
  84,
  92,
  102,
  112,
  122,
  132,
  144,
  156,
]

/**
 * Carbon's font weights.
 * Corresponds to `packages/type/src/fontWeight.js -> fontWeights`
 */
export const CARBON_FONT_WEIGHTS = {
  light: 300,
  regular: 400,
  semibold: 600,
}

/**
 * Carbon's font families with fallbacks.
 * Corresponds to `packages/type/src/fontFamily.js -> fontFamilies`
 */
export const CARBON_FONT_FAMILIES = {
  mono: '\'IBM Plex Mono\', \'Menlo\', \'DejaVu Sans Mono\', \'Bitstream Vera Sans Mono\', Courier, monospace',
  sans: '\'IBM Plex Sans\', system-ui, -apple-system, BlinkMacSystemFont, \'.SFNSText-Regular\', sans-serif',
  sansCondensed: '\'IBM Plex Sans Condensed\', \'Helvetica Neue\', Arial, sans-serif',
  sansHebrew: '\'IBM Plex Sans Hebrew\', \'Helvetica Hebrew\', \'Arial Hebrew\', sans-serif',
  serif: '\'IBM Plex Serif\', \'Georgia\', Times, serif',
}

/**
 * Converts a px value to rem string based on BASE_FONT_SIZE.
 * @param {number} pxValue
 * @returns {string} Rem string
 */
export function pxToRem(pxValue: number) {
  return `${pxValue / BASE_FONT_SIZE}rem`
}
