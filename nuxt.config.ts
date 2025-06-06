// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  ssr: false,

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

  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/image',
    '@element-plus/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/tailwindcss'
  ]
})
