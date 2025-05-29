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
      debugLogs: process.env.NUXT_DEBUG_LOGS === 'true',
    },
  },

  // Configuración de redirecciones y headers
  routeRules: {
    // Redirecciones para compatibilidad
    '/mongodb-ai-chat': { redirect: '/chat' },
    
    // Manejar rutas well-known (Chrome DevTools, etc.)
    '/.well-known/**': { 
      headers: { 'Cache-Control': 's-maxage=600' },
      cors: true 
    },
    
    // Cache system status page
    '/system-status': { swr: 60 },
    
    // Security headers for production
    '/**': {
      headers: process.env.NODE_ENV === 'production' ? {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      } : {}
    }
  },
  
  // Optimizaciones para producción
  nitro: {
    compressPublicAssets: true,
    minify: true,
    // Prerender páginas estáticas para mejor SEO y rendimiento
    prerender: {
      routes: ['/'],
      crawlLinks: false
    }
  },

  // Optimización de builds
  build: {
    transpile: process.env.NODE_ENV === 'production' ? [] : undefined
  },

  // CSS optimizations
  css: [],
  
  // Optimizaciones de rendimiento
  experimental: {
    payloadExtraction: false, // Reduce bundle size
    inlineSSRStyles: false, // Better for production caching
  },

  // Suppress development warnings for Chrome DevTools paths
  vite: {
    vue: {
      template: {
        compilerOptions: {
          // Suppress warnings in development
          isCustomElement: tag => tag.includes('well-known')
        }
      }
    }
  },

  // Additional router configuration to handle edge cases
  router: {
    options: {
      strict: false, // Allow trailing slashes
    }
  },
})
