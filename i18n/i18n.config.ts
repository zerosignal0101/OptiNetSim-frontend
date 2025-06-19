// i18n.config.ts
import { defineI18nConfig } from '#i18n'

export default defineI18nConfig(() => ({
  legacy: false, // 必须设置为 false，以使用 Vue 3 Composition API
  locale: 'zh',
  fallbackLocale: 'zh', // 如果当前语言缺少某个翻译，则回退到中文
  // 如果你想预加载一些全局通用的翻译，可以在这里导入
  // messages: {
  //   en: { general: { button: 'Submit' } },
  //   zh: { general: { button: '提交' } }
  // }
}))