import {
  createLocalFontProcessor,
} from '@unocss/preset-web-fonts/local'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: [
    // --- 布局快捷方式 ---
    ['flex-center', 'flex items-center justify-center'],
    ['flex-col-center', 'flex flex-col items-center justify-center'],
    ['container', 'max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8'],

    // --- 按钮快捷方式 ---
    // 基础样式 (可被其他按钮继承或单独使用)
    ['btn', 'px-4 py-1.5 rounded-md inline-block cursor-pointer !outline-none transition-all duration-200 ease-in-out disabled:cursor-default disabled:opacity-60'],
    // 主按钮
    ['btn-primary', 'btn bg-teal-700 text-white hover:bg-teal-800 disabled:bg-gray-400 dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-slate-600'],
    // 次按钮
    ['btn-secondary', 'btn border border-teal-700 text-teal-700 hover:bg-teal-50 disabled:border-gray-300 disabled:text-gray-400 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-400/10 dark:hover:text-teal-300 dark:disabled:border-slate-600 dark:disabled:text-slate-500'],
    // 幽灵/文本按钮 (对应您示例中的 `btn`)
    ['btn-ghost', 'btn text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:text-gray-400 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-100 dark:disabled:text-slate-500'],
    // 危险按钮
    ['btn-danger', 'btn bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 dark:bg-red-500 dark:hover:bg-red-400 dark:disabled:bg-slate-600'],

    // --- 图标按钮 ---
    ['icon-btn', 'inline-block cursor-pointer select-none !outline-none opacity-75 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600 dark:hover:text-teal-500'],
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      // 自定义图标集合的前缀，如果需要的话
      // collections: {
      //   carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
      // },
    }),
    // 排版预设，用于处理 Markdown 渲染等
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
      // 如果字体文件在本地，建议使用此处理器
      processors: createLocalFontProcessor(),
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  // 确保动态生成的 prose 类在浅色和深色模式下都能正常工作
  safelist: 'prose prose-sm m-auto text-left'.split(' '),
})
