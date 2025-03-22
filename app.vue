<template>
  <div>
    <NavBar/>
    <NuxtPage/>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSession } from '~/composables/useSession'

const session = useSession()

onMounted(() => {
  // Cargamos el token desde localStorage
  session.loadToken()

  // Si no existe token, creamos uno nuevo
  if (!session.token) {
    session.createSession()
  } else {
    console.log("Bienvenido de nuevo! Token persistente:", session.token)
  }
})
</script>