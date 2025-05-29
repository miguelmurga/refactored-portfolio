<template>
  <div>
    <NavBar/>
    <NuxtPage/>
    <LongConversationNotice/>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSession } from '~/composables/useSession'
import { useApiService } from '~/composables/useApiService'
import { useChatStore } from '~/stores/chatStore'

const session = useSession()
const api = useApiService()

onMounted(async () => {
  // ✅ SOLUCIÓN CRÍTICA: SOLO inicializar sesión UNA VEZ - NO cargar conversaciones aquí
  try {
    console.log("[App] === INICIALIZACIÓN ÚNICA DE SESIÓN ===")
    
    // ✅ PASO 1: Solo inicializar/reutilizar token de sesión
    try {
      const token = await session.initSession()
      console.log(`[App] Token ESTABLE obtenido: ${token ? token.substring(0, 8) + '...' : 'NINGUNO'}`)
      
      // ✅ CRÍTICO: NO cargar conversaciones aquí - dejar que cada página las cargue cuando las necesite
      if (session.isSessionInitialized && session.token) {
        console.log(`[App] ✅ Sesión inicializada con token persistente: ${session.token.substring(0, 8)}...`)
        console.log("[App] Las conversaciones se cargarán cuando se navegue a /chat")
      } else {
        console.error("[App] ❌ Sesión no inicializada correctamente")
      }
    } catch (sessionError) {
      console.error("[App] Error inicializando sesión:", sessionError)
      
      // ✅ RECUPERACIÓN SIMPLIFICADA: Solo establecer token si existe
      const storedToken = localStorage.getItem('userSessionToken')
      if (storedToken) {
        console.log(`[App] Recuperación: Usando token existente ${storedToken.substring(0, 8)}...`)
        session.setToken(storedToken)
        session.isSessionInitialized = true
        console.log("[App] ✅ Recuperación completada con token existente")
      } else {
        console.error("[App] ❌ No hay token disponible para recuperación")
      }
    }
  } catch (error) {
    console.error("[App] Error crítico durante inicialización:", error)
  }
})
</script>