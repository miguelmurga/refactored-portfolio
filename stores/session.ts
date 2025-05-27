// stores/session.ts
import { defineStore } from 'pinia'
import { useRuntimeConfig } from '#app'

// Constantes para keys de localStorage
const TOKEN_KEY = 'userSessionToken' // Cambiado a 'userSessionToken' según instrucciones del backend
const USER_ID_KEY = 'chatUserId'
const SESSION_DATA_KEY = 'chatSessionData'

/**
 * Store for managing user session with the backend.
 * This store handles the communication token between the frontend and backend.
 * It provides methods to store, retrieve, and manage the session token as described
 * in the system documentation.
 */
export const useSessionStore = defineStore('session', {
    state: () => ({
        token: '' as string,
        userId: '' as string, // To store the user_id associated with this session
        lastError: null as Error | null,
        loading: false,
        sessionData: null as any, // Para almacenar datos adicionales de la sesión
        isSessionInitialized: false // NUEVO: Indicador global de sesión completamente inicializada
    }),
    actions: {
        /**
         * Save the session token to localStorage and update the state
         * @param token Session token from backend (UUID v4)
         */
        setToken(token: string) {
            this.token = token
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(TOKEN_KEY, token)
                    // Intentar sincronizar con sessionStorage también para mayor consistencia
                    sessionStorage.setItem(TOKEN_KEY, token)
                    console.log("[Session] Token saved to storage:", token.substring(0, 8) + '...')
                } catch (error) {
                    console.error("[Session] Error saving token to storage:", error)
                }
            }
        },
        
        /**
         * Save session data to localStorage
         * @param data Additional session data to store
         */
        setSessionData(data: any) {
            this.sessionData = data
            if (typeof window !== 'undefined' && data) {
                try {
                    localStorage.setItem(SESSION_DATA_KEY, JSON.stringify(data))
                    // Sincronizar con sessionStorage
                    sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify(data))
                    console.log("[Session] Session data saved to storage")
                } catch (error) {
                    console.error("[Session] Error saving session data to storage:", error)
                }
            }
        },
        
        /**
         * Load the session token from localStorage and validate it
         * @returns true if token was found, loaded and is valid; false otherwise
         */
        async loadToken() {
            if (typeof window !== 'undefined') {
                try {
                    // Intentar obtener el token del localStorage
                    const storedToken = localStorage.getItem(TOKEN_KEY);
                    
                    if (storedToken) {
                        console.log("[Session] Token found in localStorage:", storedToken.substring(0, 8) + '...');
                        
                        // Actualizar el token en el store temporalmente (se validará en initSession)
                        this.token = storedToken;
                        
                        // Cargar datos de sesión adicionales
                        this.loadSessionData();
                        
                        // Inicializar la sesión completa que validará el token
                        const validToken = await this.initSession();
                        return !!validToken;
                    } else {
                        console.log("[Session] No token found in localStorage");
                        return false;
                    }
                } catch (error) {
                    console.error("[Session] Error accessing storage:", error);
                    return false;
                }
            }
            return false;
        },
        
        /**
         * Load session data from localStorage
         */
        loadSessionData() {
            if (typeof window !== 'undefined') {
                try {
                    // Intentar primero desde sessionStorage
                    let storedData = sessionStorage.getItem(SESSION_DATA_KEY)
                    
                    // Si no está en sessionStorage, probar localStorage
                    if (!storedData) {
                        storedData = localStorage.getItem(SESSION_DATA_KEY)
                        
                        // Si lo encontramos en localStorage, sincronizar con sessionStorage
                        if (storedData) {
                            sessionStorage.setItem(SESSION_DATA_KEY, storedData)
                        }
                    }
                    
                    if (storedData) {
                        try {
                            this.sessionData = JSON.parse(storedData)
                            console.log("[Session] Session data loaded from storage")
                            
                            // Si hay un userId en los datos, cargarlo también
                            if (this.sessionData?.userId) {
                                this.userId = this.sessionData.userId
                            }
                        } catch (parseError) {
                            console.error("[Session] Error parsing session data:", parseError)
                            this.sessionData = null
                        }
                    }
                } catch (error) {
                    console.error("[Session] Error loading session data:", error)
                }
            }
        },
        
        /**
         * Set the user ID for this session
         * @param userId The user ID from the backend
         */
        setUserId(userId: string) {
            this.userId = userId
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(USER_ID_KEY, userId)
                    sessionStorage.setItem(USER_ID_KEY, userId)
                    
                    // Actualizar también en sessionData
                    if (this.sessionData) {
                        this.sessionData.userId = userId
                        this.setSessionData(this.sessionData)
                    } else {
                        this.setSessionData({ userId })
                    }
                } catch (error) {
                    console.error("[Session] Error saving userId to storage:", error)
                }
            }
        },
        
        /**
         * Clear the token from both the store and localStorage
         */
        clearToken() {
            this.token = ''
            this.userId = ''
            this.sessionData = null
            
            if (typeof window !== 'undefined') {
                try {
                    // Limpiar localStorage
                    localStorage.removeItem(TOKEN_KEY)
                    localStorage.removeItem(USER_ID_KEY)
                    localStorage.removeItem(SESSION_DATA_KEY)
                    
                    console.log("[Session] Token and session data cleared from storage")
                } catch (error) {
                    console.error("[Session] Error clearing storage:", error)
                }
            }
        },
        
        /**
         * Initialize session following the backend flow:
         * 1. Look for existing token in localStorage
         * 2. If token exists, validate it with check-session endpoint
         * 3. If token is invalid or doesn't exist, request a new one
         */
        async initSession() {
            this.loading = true;
            this.lastError = null;
            
            try {
                console.log("[INIT] === INICIO DE INICIALIZACIÓN CENTRALIZADA DE SESIÓN ===");
                
                // Get runtime config for API URL
                const config = useRuntimeConfig();
                const apiUrl = config.public.apiUrl || '/api';
                
                // 1. Leer token de localStorage (ÚNICA FUENTE DE VERDAD)
                const tokenLocal = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
                console.log("[INIT] Token en localStorage:", tokenLocal ? `${tokenLocal.substring(0, 8)}...` : "NO EXISTE");
                
                // 2. Si se encontró tokenLocal
                if (tokenLocal) {
                    console.log("[INIT] Validando token existente:", tokenLocal.substring(0, 8) + "...");
                    
                    try {
                        // Llamar al endpoint POST /api/check-session/
                        const checkSessionResponse = await fetch(`${apiUrl}/check-session/`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'User-Session-ID': tokenLocal 
                            },
                            body: JSON.stringify({ token: tokenLocal })
                        });
                        
                        // Si la respuesta HTTP es exitosa, procesar el contenido
                        if (checkSessionResponse.ok) {
                            const respuestaCheckSession = await checkSessionResponse.json();
                            console.log("[INIT] Respuesta de /api/check-session:", respuestaCheckSession);
                            
                            // Analizar respuesta para determinar si el token es válido
                            // Verificamos isValid en cualquier nivel de la respuesta
                            const tokenEsValido = 
                                respuestaCheckSession.isValid === true || 
                                respuestaCheckSession.valid === true || 
                                (respuestaCheckSession.session && respuestaCheckSession.session.isValid === true) ||
                                (respuestaCheckSession.session && respuestaCheckSession.session.valid === true);
                            
                            // Si respuestaCheckSession.isValid === true (o equivalente)
                            if (tokenEsValido) {
                                // ACCIÓN CORRECTA: Establecer tokenLocal como el active_session_id global
                                this.token = tokenLocal;
                                console.log("[INIT-OK] Token local VALIDADO. Usando:", tokenLocal.substring(0, 8) + "...");
                                
                                // Guardar en ambos storages para máxima persistencia
                                localStorage.setItem(TOKEN_KEY, tokenLocal);
                                sessionStorage.setItem(TOKEN_KEY, tokenLocal);
                                
                                // Extraer userId si existe
                                if (respuestaCheckSession.session?.userId || respuestaCheckSession.userId) {
                                    this.userId = respuestaCheckSession.session?.userId || respuestaCheckSession.userId;
                                    
                                    // Guardar datos de sesión adicionales
                                    this.setSessionData({
                                        userId: this.userId,
                                        created: respuestaCheckSession.session?.created || respuestaCheckSession.created || new Date().toISOString(),
                                        validated: new Date().toISOString(),
                                        has_conversations: respuestaCheckSession.has_conversations === true,
                                        conversations_count: respuestaCheckSession.conversations_count || 0
                                    });
                                }
                                
                                // MARCAR LA SESIÓN COMO INICIALIZADA
                                this.isSessionInitialized = true;
                                
                                // Proceder al Paso 2 (Cargar Lista de Conversaciones) - manejado en app.vue
                                return tokenLocal;
                            } 
                            // Si respuestaCheckSession.isValid === false (o equivalente)
                            else {
                                // Borrar userSessionToken de localStorage
                                localStorage.removeItem(TOKEN_KEY);
                                sessionStorage.removeItem(TOKEN_KEY);
                                this.token = '';
                                
                                console.warn("[INIT-FAIL] Token local INVÁLIDO o check-session falló. Creando nuevo...");
                                // Proceder a Crear Nuevo Token (ver abajo)
                            }
                        } 
                        // Si la respuesta HTTP NO es exitosa
                        else {
                            console.warn(`[INIT-FAIL] Error en check-session: ${checkSessionResponse.status}. Procederemos a crear nuevo token...`);
                            
                            // Tomar una decisión basada en la gravedad del error
                            // Para errores 401/403, el token es inválido, así que lo borramos
                            if (checkSessionResponse.status === 401 || checkSessionResponse.status === 403) {
                                localStorage.removeItem(TOKEN_KEY);
                                sessionStorage.removeItem(TOKEN_KEY);
                                this.token = '';
                            }
                            // Para otros errores, podríamos intentar seguir usando el token actual
                            else {
                                // RECUPERACIÓN: En caso de errores como 500 o problemas de red, intentar usar el token existente
                                console.log('[INIT-RECOVERY] Intentando usar token existente a pesar del error HTTP');
                                this.token = tokenLocal;
                                this.isSessionInitialized = true;
                                
                                // Guardar en ambos storages para máxima persistencia
                                localStorage.setItem(TOKEN_KEY, tokenLocal);
                                sessionStorage.setItem(TOKEN_KEY, tokenLocal);
                                
                                // Reportar como inicializado con token existente a pesar del error
                                console.log("[INIT-OK] Token local utilizado a pesar del error de validación:", tokenLocal.substring(0, 8) + "...");
                                return tokenLocal;
                            }
                        }
                    }
                    // Error al llamar a check-session (ejemplo: problema de red)
                    catch (errorValidacion) {
                        console.error('[INIT-ERROR] Error durante validación de token:', errorValidacion);
                        
                        // RECUPERACIÓN: Intentar usar el token existente a pesar del error
                        console.log('[INIT-RECOVERY] Intentando usar token existente a pesar del error');
                        this.token = tokenLocal;
                        this.isSessionInitialized = true;
                        
                        console.log("[INIT-OK] Token local utilizado a pesar del error de validación:", tokenLocal.substring(0, 8) + "...");
                        return tokenLocal;
                    }
                }
                
                // 3. Si NO se encontró tokenLocal (o fue invalidado en el paso anterior)
                console.log("[INIT-NEW] No hay token válido. Creando nuevo con /api/create-session/");
                
                try {
                    // Llamar al endpoint POST /api/create-session/
                    const createResponse = await fetch(`${apiUrl}/create-session/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: this.userId || 'usuario_test',
                            language: 'es', // Idioma por defecto
                            permanent: true // Indicar que queremos un token permanente
                        })
                    });
                    
                    // Verificar respuesta HTTP
                    if (!createResponse.ok) {
                        throw new Error(`Error ${createResponse.status} creando nuevo token: ${createResponse.statusText}`);
                    }
                    
                    // Procesar respuesta JSON
                    const createData = await createResponse.json();
                    
                    // Obtener el nuevo token
                    const nuevoToken = createData.token || createData.session_id;
                    
                    if (!nuevoToken) {
                        throw new Error('No se recibió token del backend en create-session');
                    }
                    
                    // Guardar NUEVO_TOKEN en localStorage como userSessionToken
                    localStorage.setItem(TOKEN_KEY, nuevoToken);
                    sessionStorage.setItem(TOKEN_KEY, nuevoToken);
                    
                    // Establecer NUEVO_TOKEN como el active_session_id global
                    this.token = nuevoToken;
                    
                    // Guardar información adicional si está disponible
                    if (createData.userId) {
                        this.userId = createData.userId;
                    }
                    
                    // Guardar metadatos de sesión
                    this.setSessionData({
                        userId: this.userId || createData.userId || 'usuario_test',
                        created: new Date().toISOString()
                    });
                    
                    // Marcar sesión como inicializada
                    this.isSessionInitialized = true;
                    
                    console.log("[INIT-OK] Nuevo token creado y guardado:", nuevoToken.substring(0, 8) + "...");
                    
                    // Devolver el nuevo token para su uso
                    return nuevoToken;
                } 
                catch (errorCreacion) {
                    console.error('[INIT-ERROR] Error crítico creando nuevo token:', errorCreacion);
                    this.lastError = errorCreacion;
                    throw errorCreacion;
                }
            } finally {
                this.loading = false;
            }
        },
        
        /**
         * Create a new session by requesting a token from the backend.
         * @deprecated Use initSession() instead which follows the complete flow
         */
        async createSession() {
            return this.initSession();
        },
        
        /**
         * Refresh the session by clearing the current token and creating a new one
         */
        async refreshSession() {
            this.clearToken();
            return await this.createSession();
        }
    }
})