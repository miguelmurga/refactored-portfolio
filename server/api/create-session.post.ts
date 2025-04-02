import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig() // No se importa desde 'h3'; Nuxt lo inyecta automáticamente
    const backendUrl = `${config.public.apiUrl}/create-session/`
    const secret = config.jwtSecret  // Este debe ser "tu_clave_secreta_super_segura"

    if (!secret) {
        event.res.statusCode = 500
        return { error: 'JWT secret is not defined in runtimeConfig.' }
    }

    // Genera el token usando el mismo secreto
    const token = jwt.sign({ client: 'nuxt' }, secret, { expiresIn: '1h' })

    try {
        const response = await $fetch(backendUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return response
    } catch (error: any) {
        console.error('Error fetching backend session endpoint:', error)
        event.res.statusCode = error?.response?.status || 500
        return {
            error: error?.data?.error ||
                error?.message ||
                'Error connecting to backend session endpoint.',
        }
    }
})
