// stores/session.ts
import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
    state: () => ({
        token: '' as string,
    }),
    actions: {
        setToken(token: string) {
            this.token = token
            if (typeof window !== 'undefined') {
                localStorage.setItem('sessionToken', token)
            }
            console.log("Session token set:", token)
        },
        loadToken() {
            if (typeof window !== 'undefined') {
                const storedToken = localStorage.getItem('sessionToken')
                if (storedToken) {
                    this.token = storedToken
                    console.log("Bienvenido de nuevo! Session token loaded:", storedToken)
                } else {
                    console.log("Hola, veo que es tu primera vez aquí.")
                }
            }
        },
        async createSession() {
            try {
                const data = await $fetch<{ session_id: string }>('/api/create-session', {
                    method: 'POST'
                })
                if (data?.session_id) {
                    this.setToken(data.session_id)
                    console.log("Hola, veo que es tu primera vez aquí. Nuevo token creado:", data.session_id)
                } else {
                    console.error("No se recibió 'session_id' en la respuesta:", data)
                }
            } catch (error) {
                console.error('Error al crear la sesión:', error)
            }
        }
    }
})
