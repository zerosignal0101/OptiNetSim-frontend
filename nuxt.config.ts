// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },
  ssr: false,

  runtimeConfig: {
    // Keys within public are also exposed client-side
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api' as string // Default if not set
    }
  },

  fonts: {
    providers: {
      google: false,
      googleicons: false
    }
  },
  css: [
    "v-network-graph/lib/style.css",
    '~/assets/scss/index.scss'
  ],
  // colorMode
  colorMode: {
    classSuffix: '',
  },
  typescript: {
    typeCheck: true
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "@/assets/scss/element/index.scss" as element;`,
        },
      },
    },
  },

  elementPlus: {
    icon: 'ElIcon',
    importStyle: 'scss',
    themes: ['dark'],
  },

  // ++ 新增或修改 i18n 配置 ++
  i18n: {
    /**
     * 路由策略
     * - `no_prefix`: 所有路由都没有语言前缀。URL看起来是 /about。不利于SEO和分享。
     * - `prefix_except_default`: 除了默认语言外，其他语言的路由都有前缀。例如，默认中文，URL是 /about；英文是 /en/about。推荐！
     * - `prefix`: 所有语言的路由都有前缀。例如，中文是 /zh-CN/about，英文是 /en/about。
     * - `prefix_and_default`: 结合了 `prefix` 和 `prefix_except_default`，不常用。
     */
    strategy: 'prefix_except_default',
    
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        file: 'en-US.ts' // 懒加载对应的文件名
      },
      {
        code: 'zh',
        iso: 'zh-CN',
        name: '简体中文',
        file: 'zh-CN.ts' // 懒加载对应的文件名
      }
    ],

    bundle: {
      optimizeTranslationDirective: false,
    },
    
    lazy: true, // 启用懒加载
    langDir: 'locales/', // 存放翻译文件的目录
    defaultLocale: 'zh', // 设置默认语言为中文
    
    // 为了更好的Vue-i18n集成和性能
    vueI18n: './i18n.config.ts'
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/image',
    '@element-plus/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/tailwindcss',
    'nuxt-lodash',
    '@pinia/nuxt',
    '@nuxtjs/i18n'
  ]
})
