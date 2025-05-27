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
  i18n: {
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    locales: ['en', 'es', 'pt'],
    defaultLocale: 'es',
    skipSettingLocaleOnNavigate: true,
    vueI18n: './i18n.config.ts',
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_API_URL || 'http://localhost:8000/api',
      devMode: process.env.NUXT_DEV_MODE === 'true',
    },
  },
  // Configuración de redirecciones para mantener compatibilidad
  routeRules: {
    '/mongodb-ai-chat': { redirect: '/chat' },
    '/.well-known/**': { cors: true, swr: 600 }, // Manejar rutas well-known con CORS y caché de 10 minutos
    '/system-status': { swr: 60 }, // Cache system status page for 1 minute
  },
  
  // Mejorar rendimiento con compresión gzip
  nitro: {
    compressPublicAssets: true,
  },
})
