// server/api/create-session.post.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
    // Usamos 127.0.0.1 para evitar problemas con IPv6 (::1)
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000/api/create-session/'
    try {
        const response = await $fetch(backendUrl, { method: 'POST' })
        return response
    } catch (error) {
        console.error('Error fetching backend session endpoint:', error)
        // Se establece el código de estado a 500 y se retorna un objeto de error
        event.res.statusCode = 500
        return { error: 'Error connecting to backend session endpoint.' }
    }
})
