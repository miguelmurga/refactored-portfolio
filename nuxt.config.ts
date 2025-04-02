// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@pinia/nuxt'],
  ui: {
    global: true,
  },
  colorMode: {
    classSuffix: '',
  },
  runtimeConfig: {
    jwtSecret: process.env.NUXT_JWT_SECRET, // Esto toma el valor de NUXT_JWT_SECRET
    public: {
      apiUrl: process.env.NUXT_API_URL,      // Esto toma el valor de NUXT_API_URL
    },
  },
})
