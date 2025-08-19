// uno.config.ts
import {
  createLocalFontProcessor,
} from '@unocss/preset-web-fonts/local'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

import { CARBON_FONT_FAMILIES } from './uno-configs/_base' // Import font families for presetWebFonts
// 导入你的模块
import { carbonColors } from './uno-configs/colors'
import { customRules } from './uno-configs/rules'
import { utilityShortcuts } from './uno-configs/shortcuts-utility'
import { spacingLayoutTheme } from './uno-configs/spacing-layout'
import { typographyShortcuts, typographyTheme } from './uno-configs/typography'

export default defineConfig({
  shortcuts: [
    ...utilityShortcuts, // 通用快捷方式 (数组)
    typographyShortcuts, // 排版快捷方式 (对象)
  ],
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons(),
    presetTypography(),
    presetWebFonts({
      // We list the font families Carbon uses here so UnoCSS can fetch them (if web fonts)
      // or ensure local font processing via createLocalFontProcessor.
      // Use imported CARBON_FONT_FAMILIES for web fonts processor
      fonts: {
        'mono': CARBON_FONT_FAMILIES.mono.split(',')[0].replace(/'/g, '').trim(), // Extract first font name
        'sans': CARBON_FONT_FAMILIES.sans.split(',')[0].replace(/'/g, '').trim(),
        'sans-condensed': CARBON_FONT_FAMILIES.sansCondensed.split(',')[0].replace(/'/g, '').trim(),
        'sans-hebrew': CARBON_FONT_FAMILIES.sansHebrew.split(',')[0].replace(/'/g, '').trim(),
        'serif': CARBON_FONT_FAMILIES.serif.split(',')[0].replace(/'/g, '').trim(),
        // Note: Carbon also lists other regional sans fonts, you might add them if needed:
        // 'sans-arabic': 'IBM Plex Sans Arabic',
        // 'sans-devanagari': 'IBM Plex Sans Devanagari',
        // 'sans-jp': 'IBM Plex Sans JP',
        // 'sans-kr': 'IBM Plex Sans KR',
        // 'sans-thai-looped': 'IBM Plex Sans Thai Looped',
        // 'sans-thai': 'IBM Plex Sans Thai',
      },
      processors: createLocalFontProcessor(),
    }),
  ],
  theme: {
    colors: carbonColors, // 直接导入完整的颜色对象
    ...typographyTheme, // 合并排版主题（fontFamily, fontWeight, lineHeight, letterSpacing）
    ...spacingLayoutTheme, // 合并间距和布局主题（breakpoints, spacing, maxWidth, widths, heights, iconSizes）
    // 如果有其他顶层主题属性，可以在这里添加
  },
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  safelist: 'prose prose-sm m-auto text-left'.split(' '),
  rules: customRules, // 导入自定义规则
})
