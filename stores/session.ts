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
                    console.log("Welcome back! Session token loaded:", storedToken)
                } else {
                    console.log("Hello, looks like it's your first time here.")
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
                    console.log("Hello, looks like it's your first time here. New token created:", data.session_id)
                } else {
                    console.error("No 'session_id' received in response:", data)
                }
            } catch (error) {
                console.error('Error creating session:', error)
            }
        }
    }
})

