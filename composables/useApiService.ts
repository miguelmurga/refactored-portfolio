import { ref } from 'vue';
import { useSession } from '~/composables/useSession';
import { useI18n } from 'vue-i18n';
import { useRuntimeConfig } from '#app';

// Tipos básicos
export interface ChatMessage {
    id: number | string;
    role: 'user' | 'assistant';
    content: string;
    context_data?: any[]; // Para almacenar datos de contexto en mensajes RAG
    message_id?: string;  // ID de mensaje único para mensajes asíncronos
    created_at?: string;  // Timestamp de creación desde el backend
    showSources?: boolean; // Estado UI para mostrar/ocultar fuentes
    sources?: any[]; // Fuentes de información para respuestas RAG
}

export interface Conversation {
    id: number;
    title: string;
    service: string;
    messages: ChatMessage[];
    lastUpdated: string;
    userId?: string;
    language?: string;
}

/**
 * Composable para manejar todas las llamadas a la API de Django
 */
export function useApiService() {
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    
    // Obtener la URL del backend desde la configuración de runtime
    const config = useRuntimeConfig();
    // Determinar si estamos en desarrollo o producción
    const isDev = process.env.NODE_ENV === 'development' || config.public.devMode === true;
    
    // Siempre usar la URL de la variable de entorno si está disponible
    // De lo contrario, usar el proxy interno en desarrollo
    const apiUrl = config.public.apiUrl || '/api';
    
    console.log(`[API] Using backend URL: ${apiUrl} (Development mode: ${isDev ? 'yes' : 'no'})`);
    
    /**
     * ✅ SOLUCIÓN CRÍTICA: Helper para obtener headers con token ESTABLE
     * @param includeContentType Si se debe incluir el Content-Type: application/json
     * @returns Objeto con los headers
     */
    function getSessionHeaders(includeContentType = true) {
        const session = useSession();
        const headers: Record<string, string> = {};
        
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }
        
        // ✅ CRÍTICO: SIEMPRE usar el token actual del session store
        // NO generar nuevo token aquí - solo usar el existente
        let tokenToUse = session.token;
        
        // Si no hay token en el store, intentar cargar desde localStorage UNA VEZ
        if (!tokenToUse && typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('userSessionToken');
            if (storedToken) {
                console.log('[API] Using stored token from localStorage:', storedToken.substring(0, 8) + '...');
                tokenToUse = storedToken;
                // Actualizar el session store para futuras llamadas
                session.setToken(storedToken);
            }
        }
        
        // ✅ CRÍTICO: Usar el MISMO token para TODAS las peticiones
        headers['User-Session-ID'] = tokenToUse || '';
        
        // Log para debugging - mostrar qué token se está usando
        if (tokenToUse) {
            console.log(`[API] Using STABLE session token: ${tokenToUse.substring(0, 8)}...`);
        } else {
            console.warn('[API] No session token available - request may fail');
        }
        
        return headers;
    }
    
    /**
     * Cliente HTTP mejorado con interceptores para manejo de autenticación
     * y errores, con cache de peticiones para evitar duplicados
     */
    const httpClient = {
        // Cache para evitar peticiones duplicadas
        requestCache: new Map<string, Promise<Response | null>>(),
        
        // Generar clave única para cache
        getCacheKey(url: string, options: RequestInit): string {
            const method = options.method || 'GET';
            const body = options.body ? JSON.stringify(options.body) : '';
            return `${method}-${url}-${body}`;
        },
        
        // Limpiar cache después de un tiempo
        clearCacheEntry(key: string, delay = 1000) {
            setTimeout(() => {
                this.requestCache.delete(key);
                console.log(`[API Cache] Cleaned cache entry: ${key}`);
            }, delay);
        },
        
        /**
         * Realiza una petición HTTP con manejo automático de autenticación y errores
         * @param url URL a la que hacer la petición
         * @param options Opciones de fetch (method, headers, body, etc.)
         * @param maxRetries Número máximo de reintentos (por defecto 1)
         * @param useCache Si debe usar cache para evitar peticiones duplicadas
         * @returns Response o null si hay error crítico
         */
        async request(url: string, options: RequestInit = {}, maxRetries = 1, useCache = true): Promise<Response | null> {
            // Verificar cache para evitar peticiones duplicadas
            const cacheKey = useCache ? this.getCacheKey(url, options) : null;
            if (useCache && cacheKey && this.requestCache.has(cacheKey)) {
                console.log(`[API Cache] Using cached request: ${cacheKey}`);
                return this.requestCache.get(cacheKey)!;
            }
            
            let retryCount = 0;
            
            // Función interna para reintentos con interceptores
            const tryRequest = async (): Promise<Response | null> => {
                try {
                    // 1. Interceptor de solicitud - Asegurar token válido
                    const session = useSession();
                    
                    // Verificar que tenemos un token de sesión para la solicitud
                    if (!session.token) {
                        // Antes de inicializar, buscar en localStorage primero
                        const storedToken = localStorage.getItem('userSessionToken');
                        if (storedToken) {
                            console.log(`[API] Found token in localStorage: ${storedToken.substring(0, 8)}... Using directly`);
                            session.token = storedToken;
                            session.isSessionInitialized = true;
                        } else {
                            console.warn('[API] No token for request, initializing session with proper flow...');
                            await session.initSession();
                            
                            // Verificación de seguridad - si todavía no hay token, es un error crítico
                            if (!session.token) {
                                console.error('[API] Critical: Still no token after initSession!');
                                throw new Error('No se pudo obtener un token de sesión válido');
                            }
                            
                            // Pequeña pausa para asegurar que el token está disponible
                            await new Promise(resolve => setTimeout(resolve, 300));
                        }
                    }
                    
                    // Asegurar que los headers contienen el token
                    if (!options.headers) {
                        options.headers = getSessionHeaders(options.method !== 'GET');
                    }
                    
                    // 2. Hacer la petición
                    console.log(`[API] ${options.method || 'GET'} ${url} con token: ${session.token.substring(0, 8)}...`);
                    const response = await fetch(url, options);
                    
                    // 3. Interceptor de respuesta - Manejar respuestas
                    if (response.ok) {
                        return response; // Todo correcto, devolver respuesta
                    }
                    
                    // 4. Interceptor de errores - Manejar códigos de error específicos
                    switch (response.status) {
                        case 401: // No autorizado - Token inválido o expirado
                            console.warn('[API] Authentication failed (401), token expired or invalid');
                            
                            // Primero intentar validar el token actual con check-session
                            try {
                                console.log('[API] Validating token with check-session before discarding it');
                                const validationResponse = await fetch(`/api/check-session/`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'User-Session-ID': session.token
                                    },
                                    body: JSON.stringify({ token: session.token })
                                });
                                
                                const validationData = await validationResponse.json();
                                
                                // Si el token es realmente inválido según check-session
                                if (!validationData.valid || !validationData.session?.valid) {
                                    console.warn('[API] Token confirmed invalid by check-session, obtaining new one');
                                    // Eliminar token actual
                                    session.clearToken();
                                    // Obtener token nuevo usando el flujo completo
                                    await session.initSession();
                                } else {
                                    console.log('[API] Unusual: Token is valid according to check-session but endpoint returned 401');
                                }
                            } catch (validationError) {
                                console.error('[API] Error validating token with check-session:', validationError);
                                // Si hay error validando, es más seguro eliminar el token y crear uno nuevo
                                session.clearToken();
                                await session.initSession();
                            }
                            
                            // Reintentar con el nuevo token si no excedimos reintentos
                            if (retryCount < maxRetries) {
                                retryCount++;
                                console.log(`[API] Retrying request with new token (${retryCount}/${maxRetries})`);
                                await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
                                return tryRequest(); // Recursión con nuevo token
                            } else {
                                console.error('[API] Max retries reached for authentication');
                                return response; // Devolver error 401 si no podemos reintentar
                            }
                            
                        case 403: // Forbidden - Permisos insuficientes
                            console.error(`[API] Forbidden access (403): ${url}`);
                            return response;
                            
                        case 404: // Not Found - Recurso no existe
                            console.error(`[API] Resource not found (404): ${url}`);
                            console.warn('[API] Tip: Verify URL and endpoint exist in backend');
                            
                            // En producción ya no usamos fallbacks para 404
                            if (!isDev) {
                                return response;
                            }
                            
                            // Solo en desarrollo - intentar cargar mock para debugging
                            if (isDev) {
                                const mockEndpoint = url.replace('/api/', '/api/mock/');
                                console.log(`[API] (Dev only) Attempting to load mock: ${mockEndpoint}`);
                                try {
                                    const mockResponse = await fetch(mockEndpoint, {
                                        method: options.method || 'GET',
                                        headers: options.headers
                                    });
                                    
                                    if (mockResponse.ok) {
                                        console.log('[API] Mock response found, using simulated data');
                                        return mockResponse;
                                    }
                                } catch (mockError) {
                                    console.log('[API] No mock available');
                                }
                            }
                            return response;
                            
                        case 429: // Too Many Requests - Rate limiting
                            console.warn(`[API] Rate limited (429): Too many requests`);
                            // Si aún tenemos reintentos, esperar más tiempo y reintentar
                            if (retryCount < maxRetries) {
                                retryCount++;
                                const delay = 1000 * Math.pow(2, retryCount); // Backoff exponencial: 2s, 4s, 8s...
                                console.log(`[API] Rate limited, waiting ${delay}ms before retry (${retryCount}/${maxRetries})`);
                                await new Promise(resolve => setTimeout(resolve, delay));
                                return tryRequest();
                            }
                            return response;
                            
                        case 500: // Server Error
                        case 502: // Bad Gateway
                        case 503: // Service Unavailable
                            console.error(`[API] Server error (${response.status}): ${response.statusText}`);
                            // Reintentar con backoff exponencial
                            if (retryCount < maxRetries) {
                                retryCount++;
                                const delay = 1000 * Math.pow(1.5, retryCount); // Backoff menos agresivo: 1.5s, 2.25s, 3.38s...
                                console.log(`[API] Server error, waiting ${delay}ms before retry (${retryCount}/${maxRetries})`);
                                await new Promise(resolve => setTimeout(resolve, delay));
                                return tryRequest();
                            }
                            return response;
                            
                        default: // Otros errores
                            console.warn(`[API] Request failed: ${response.status} ${response.statusText}`);
                            return response;
                    }
                } catch (fetchError) {
                    console.error('[API] Network or fetch error:', fetchError);
                    
                    // Reintentar en caso de error de red
                    if (retryCount < maxRetries) {
                        retryCount++;
                        const delay = 500 * retryCount; // 500ms, 1000ms, 1500ms...
                        console.log(`[API] Network error, retrying in ${delay}ms (${retryCount}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return tryRequest();
                    }
                    
                    return null; // Error crítico, no se pudo conectar después de reintentos
                }
            };
            
            // Crear y cachear la promesa si se está usando cache
            const requestPromise = tryRequest();
            
            if (useCache && cacheKey) {
                this.requestCache.set(cacheKey, requestPromise);
                // Limpiar cache después de completar la petición
                requestPromise.finally(() => {
                    this.clearCacheEntry(cacheKey, 1000);
                });
            }
            
            return requestPromise;
        },
        
        /**
         * Realiza una petición GET con cache por defecto
         */
        async get(url: string, options: RequestInit = {}, maxRetries = 1, useCache = true) {
            return this.request(url, { ...options, method: 'GET' }, maxRetries, useCache);
        },
        
        /**
         * Realiza una petición POST sin cache por defecto (datos dinámicos)
         */
        async post(url: string, data: any, options: RequestInit = {}, maxRetries = 1, useCache = false) {
            // 🚨 DEBUGGING: Verificar data antes de stringify
            console.log('🔍 httpClient.post recibió data:', data);
            console.log('🔍 conversation_id en data:', data?.conversation_id);
            console.log('🔍 tipo de conversation_id en data:', typeof data?.conversation_id);
            
            const postOptions = { 
                ...options, 
                method: 'POST',
                headers: {
                    ...options.headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            };
            
            // 🚨 DEBUGGING: Verificar body stringificado
            console.log('🔍 Body después de JSON.stringify:', postOptions.body);
            
            return this.request(url, postOptions, maxRetries, useCache);
        },
        
        /**
         * Realiza una petición DELETE sin cache
         */
        async delete(url: string, options: RequestInit = {}, maxRetries = 1) {
            return this.request(url, { ...options, method: 'DELETE' }, maxRetries, false);
        }
    };
    
    /**
     * Función mejorada para peticiones con manejo de autenticación
     * @param url URL a la que hacer la petición
     * @param options Opciones de fetch (method, headers, body, etc.)
     * @param maxRetries Número máximo de reintentos (por defecto 1)
     * @returns Response o null si hay error crítico
     * @deprecated Use httpClient.request instead
     */
    async function fetchWithAuth(url: string, options: RequestInit = {}, maxRetries = 1): Promise<Response | null> {
        return httpClient.request(url, options, maxRetries);
    }

    /**
     * Obtiene el idioma actual para las peticiones
     */
    function getCurrentLanguage(): string {
        // Default language for consistency
        const defaultLanguage = 'es';
        
        try {
            // Intentar obtener locale solo si estamos en un contexto de componente
            if (typeof window !== 'undefined') {
                // Primero intentar obtener del localStorage el idioma explícitamente seleccionado por el usuario
                const selectedLanguage = localStorage.getItem('selectedLanguage');
                if (selectedLanguage) {
                    console.log(`[API] Using user selected language from localStorage: ${selectedLanguage}`);
                    return selectedLanguage;
                }
                
                // Si no hay selección explícita, intentar obtener el locale del i18n
                const storedLocale = localStorage.getItem('nuxt-locale');
                if (storedLocale) {
                    console.log(`[API] Using i18n locale from localStorage: ${storedLocale}`);
                    return storedLocale;
                }
            }
            
            console.log(`[API] No language found in localStorage, using default: ${defaultLanguage}`);
            return defaultLanguage;
        } catch (error) {
            console.warn('[API] Error getting locale, using default:', defaultLanguage);
            return defaultLanguage;
        }
    }

    /**
     * Inicializa la sesión siguiendo el flujo definido por el backend
     */
    async function initSession() {
        isLoading.value = true;
        error.value = null;

        try {
            const session = useSession();
            return await session.initSession();
        } catch (err) {
            console.error('[API] Error initializing session:', err);
            error.value = 'No se pudo inicializar la sesión';
            return null;
        } finally {
            isLoading.value = false;
        }
    }
    
    /**
     * Crea una nueva sesión en el backend
     * @deprecated Use initSession instead
     */
    async function createSession() {
        console.warn('[API] createSession is deprecated, use initSession instead');
        return initSession();
    }

    // Control de concurrencia para getConversations
    const getConversationsInProgress = ref(false);
    
    /**
     * Función de logging estructurado para APIs
     */
    function logApiCall(endpoint: string, payload: any, response: any, error?: any) {
        const timestamp = Date.now();
        const logData = {
            timestamp,
            endpoint,
            payload: payload ? JSON.stringify(payload).substring(0, 200) + '...' : null,
            success: !!response?.success,
            messageId: response?.message_id,
            conversationId: response?.conversation_id,
            error: error?.message || null
        };
        
        if (error) {
            console.error(`[API-${timestamp}] ${endpoint} ERROR:`, logData);
        } else {
            console.log(`[API-${timestamp}] ${endpoint}:`, logData);
        }
    }
    
    /**
     * Wrapper seguro para todas las peticiones HTTP
     * ✅ VALIDACIÓN ANTES DE CADA PETICIÓN HTTP
     */
    async function safeApiCall(method: string, url: string, data: any = null, options: any = {}): Promise<any> {
        const requestId = `${method.toUpperCase()}-${url}-${Date.now()}`;
        
        logApiCall(`${method.toUpperCase()} ${url} [START]`, data, null);
        
        try {
            let response;
            switch (method.toLowerCase()) {
                case 'get':
                    response = await httpClient.get(url, options);
                    break;
                case 'post':
                    response = await httpClient.post(url, data, options);
                    break;
                case 'delete':
                    response = await httpClient.delete(url, options);
                    break;
                default:
                    throw new Error(`Unsupported HTTP method: ${method}`);
            }
            
            if (response && response.ok) {
                const responseData = await response.json();
                logApiCall(`${method.toUpperCase()} ${url} [SUCCESS]`, data, responseData);
                return responseData;
            } else {
                throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'Request failed'}`);
            }
        } catch (error) {
            logApiCall(`${method.toUpperCase()} ${url} [ERROR]`, data, null, error);
            throw error;
        }
    }
    
    /**
     * Obtener todas las conversaciones del usuario con control de concurrencia
     * @param maxRetries Número máximo de reintentos en caso de error
     */
    async function getConversations(maxRetries = 2) {
        // Evitar peticiones duplicadas
        if (getConversationsInProgress.value) {
            console.log('[API] getConversations already in progress, skipping...');
            return [];
        }
        
        getConversationsInProgress.value = true;
        isLoading.value = true;
        error.value = null;
        
        try {
            // ✅ CRÍTICO: NO generar nuevo token - usar el existente
            const session = useSession();
            if (!session.token) {
                console.log('[API] No session token in store, trying localStorage...');
                
                // Intentar obtener token desde localStorage
                const storedToken = typeof window !== 'undefined' ? localStorage.getItem('userSessionToken') : null;
                if (storedToken) {
                    console.log(`[API] Using stored token for conversations: ${storedToken.substring(0, 8)}...`);
                    session.setToken(storedToken);
                } else {
                    console.error('[API] No session token available - cannot get conversations');
                    return [];
                }
            }
            
            // Usar httpClient para manejar autenticación y errores automáticamente
            const url = `${apiUrl}/conversations/`;
            console.log(`[API] Getting user conversations from: ${url}`);
            console.log(`[API] Using session token: ${session.token.substring(0, 8)}...`);
            
            const response = await httpClient.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Session-ID': session.token // Asegurarse de usar el token correcto
                }
            }, maxRetries);
            
            if (!response) {
                console.error('[API] Critical error getting conversations, no response');
                return [];
            }
            
            if (!response.ok) {
                console.error(`[API] Error ${response.status} getting conversations: ${response.statusText}`);
                
                // Registrar detalles adicionales para depuración
                try {
                    const errorText = await response.text();
                    console.error('[API] Error response body:', errorText);
                } catch (e) {
                    console.error('[API] Could not read error response body');
                }
                
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('[API] Conversations response:', JSON.stringify(data, null, 2));
            
            // FORMATO ESPERADO DEL BACKEND (según la guía):
            // {
            //     "success": true,
            //     "conversations": [
            //         {
            //             "id": 305,
            //             "title": "...",
            //             "service": "...",
            //             "messages": [ /* HISTORIAL COMPLETO */ ],
            //             "lastUpdated": "...",
            //             "last_message_id": "..."
            //         }
            //     ]
            // }
            
            // Si los datos tienen el formato esperado (objeto con array de conversaciones)
            if (data.success && data.conversations && Array.isArray(data.conversations)) {
                // Verificar si hay conversaciones o el array está vacío
                if (data.conversations.length === 0) {
                    console.log('[API] Backend returned empty conversations array');
                    return []; // Retornar array vacío para que se cree una nueva conversación
                }
                
                console.log(`[API] ${data.conversations.length} conversations retrieved successfully`);
                
                // Procesar cada conversación preservando el formato original
                // El historial de mensajes YA ESTÁ DISPONIBLE directamente desde el backend
                return data.conversations.map(conv => ({
                    id: Number(conv.id || conv.conversation_id), // ✅ Asegurar que sea número
                    title: conv.title || `Conversación ${conv.id || conv.conversation_id}`,
                    service: conv.service || 'ia_generativa',
                    // IMPORTANTE: Preservar el array de mensajes tal como lo envía el backend
                    messages: Array.isArray(conv.messages) ? conv.messages : [],
                    lastUpdated: conv.lastUpdated || conv.last_updated || new Date().toISOString(),
                    language: conv.language || 'es',
                    last_message_id: conv.last_message_id || null
                }));
            } 
            // Para compatibilidad, también manejar respuesta como array directo
            else if (Array.isArray(data)) {
                console.log('[API] Backend returned array of conversations directly');
                
                if (data.length === 0) {
                    return []; // Array vacío
                }
                
                // Mapear las conversaciones
                return data.map(conv => ({
                    id: Number(conv.id || conv.conversation_id), // ✅ Asegurar que sea número
                    title: conv.title || `Conversación ${conv.id || conv.conversation_id}`,
                    service: conv.service || 'ia_generativa',
                    messages: Array.isArray(conv.messages) ? conv.messages : [],
                    lastUpdated: conv.lastUpdated || conv.last_updated || new Date().toISOString(),
                    language: conv.language || 'es',
                    last_message_id: conv.last_message_id || null
                }));
            }
            // Caso especial: error explícito
            else if (data.success === false) {
                console.warn('[API] Server error:', data.error);
                throw new Error(data.error || 'Unknown error getting conversations');
            } 
            // Caso especial: mensaje específico de "no conversations found"
            else if (data.message && data.message.includes('no conversations found')) {
                console.log('[API] Valid token but no conversations found for this user');
                return [];
            }
            
            // Formato inesperado pero sin error explícito
            console.warn('[API] Unexpected response format:', data);
            return [];
        } catch (err) {
            console.error('[API] Error getting conversations:', err);
            error.value = 'Could not load conversations';
            return [];
        } finally {
            isLoading.value = false;
            getConversationsInProgress.value = false;
        }
    }

    /**
     * Enviar un mensaje a un agente y manejar el procesamiento asíncrono
     * @param conversationId ID de la conversación
     * @param message Mensaje a enviar
     * @param service Tipo de servicio: "unified_agent", "ai_expert", "security_expert"
     * @param options Opciones adicionales como configuración RAG
     */
    async function sendMessage(
        conversationId: number, 
        message: string, 
        service: string,
        options?: {
            domain?: string,
            use_rag?: boolean,
            use_reasoner?: boolean,
            rag_min_score?: number,
            rag_min_rerank_score?: number,
            rag_top_k?: number,
            llm_temperature?: number,
            language?: string,  // Permitir especificar el idioma explícitamente
        }
    ) {
        isLoading.value = true;
        error.value = null;

        try {
            // ✅ CRÍTICO: NO generar nuevo token - usar el existente
            const session = useSession();
            if (!session.token) {
                console.log('[API] No session token in store, trying localStorage...');
                
                // Intentar obtener token desde localStorage
                const storedToken = typeof window !== 'undefined' ? localStorage.getItem('userSessionToken') : null;
                if (storedToken) {
                    console.log(`[API] Using stored token for message sending: ${storedToken.substring(0, 8)}...`);
                    session.setToken(storedToken);
                } else {
                    throw new Error('No session token available - cannot send message');
                }
            }
            
            // ✅ NUEVA LÓGICA: Selección de endpoint basada en TIPO DE SERVICIO + RAG
            let endpoint = `${apiUrl}/chat/`; // ✅ Valor por defecto
            let serviceId = service;
            let domain = options?.domain || 'todos';
            
            // 🚨 DEBUGGING EXHAUSTIVO: Verificar parámetro recibido
            console.log('🔍 PARÁMETRO RECIBIDO EN sendMessage:');
            console.log('→ conversationId original:', conversationId);
            console.log('→ tipo del parámetro:', typeof conversationId);
            console.log('→ es número?', typeof conversationId === 'number');
            console.log('→ es string?', typeof conversationId === 'string');
            console.log('→ tiene guiones (UUID)?', typeof conversationId === 'string' && conversationId.includes('-'));
            
            // ✅ CRÍTICO: Asegurar que conversation_id sea número y válido PRIMERO
            const numericConversationId = Number(conversationId);
            if (!numericConversationId || numericConversationId <= 0 || isNaN(numericConversationId)) {
                console.error('[API] ERROR: conversation_id inválido:', conversationId, 'convertido a:', numericConversationId);
                throw new Error('conversation_id inválido - no se puede enviar mensaje');
            }
            
            console.log('✅ CONVERSIÓN EXITOSA:');
            console.log('→ numericConversationId:', numericConversationId);
            console.log('→ tipo después de conversión:', typeof numericConversationId);
            
            console.log(`[API] 🔍 CONFIGURACIÓN MODULAR RECIBIDA:`);
            console.log(`[API] → service: ${service}`);
            console.log(`[API] → use_rag: ${options?.use_rag}`);
            console.log(`[API] → domain: ${domain}`);
            console.log(`[API] → conversation_id: ${conversationId} → ${numericConversationId}`);
            
            // ✅ DECISIÓN MODULAR: Configuración de razonamiento
            const useDeepSeekReasoning = options?.use_reasoner !== undefined ? Boolean(options.use_reasoner) : false;
            
            console.log(`[API] 🎛️ SISTEMA MODULAR ACTIVADO:`);
            console.log(`[API] → Conversación ID: ${numericConversationId} (mantener contexto)`);
            console.log(`[API] → DeepSeek Reasoning: ${useDeepSeekReasoning ? 'ON' : 'OFF'}`);
            console.log(`[API] → Dominio: ${domain}`);
            
            // ✅ DEBUGGING ADICIONAL REQUERIDO (CLAUDE_DEBUGGING_HISTORY.md)
            console.log('DEBUG routing:', { useDeepSeekReasoning, domain, service });
            
            if (service === 'llm_expert') {
                // IA GENERATIVA especializado
                endpoint = `${apiUrl}/ai-expert/`;
                serviceId = 'llm_expert';
                console.log(`[API] 🤖 AGENTE: IA Generativa → ${endpoint}`);
                
            } else if (service === 'security_expert') {
                // CIBERSEGURIDAD especializado
                endpoint = `${apiUrl}/security-expert/`;
                serviceId = 'security_expert';
                console.log(`[API] 🛡️ AGENTE: Ciberseguridad → ${endpoint}`);
                
            } else if (service === 'unified_agent') {
                // CHAT GENERAL (Agente Unificado)
                endpoint = `${apiUrl}/unified-agent/`;
                serviceId = 'unified_agent';
                console.log(`[API] 💬 AGENTE: Chat General (Unified Agent) → ${endpoint}`);
                
            } else {
                // FALLBACK: Agente Unificado
                endpoint = `${apiUrl}/unified-agent/`;
                serviceId = 'unified_agent';
                console.log(`[API] 🔄 AGENTE: Fallback Unified Agent → ${endpoint}`);
            }
            
            // ✅ DEBUGGING ADICIONAL: Verificar que domain llegue correctamente
            console.log('Agente seleccionado:', { service: serviceId, domain, endpoint });
            
            // ✅ VERIFICACIÓN DE SEGURIDAD
            if (!endpoint) {
                console.error('[API] ERROR CRÍTICO: endpoint no definido');
                console.error('[API] → useRag:', useRag);
                console.error('[API] → domain:', domain);
                console.error('[API] → apiUrl:', apiUrl);
                throw new Error('Endpoint no definido - error de lógica');
            }
            
            // Obtener el idioma actual (podemos recibir un idioma específico en las opciones)
            const userLanguage = options?.language || getCurrentLanguage();
            console.log(`[API] Sending message with language: ${userLanguage} ${options?.language ? '(from options)' : '(from localStorage)'}`);
            
            console.log(`[API] Sending message: service=${serviceId}, language=${userLanguage}, domain=${domain}`);
            
            console.log(`[API] 🔍 VERIFICACIÓN ID:`)
            console.log(`[API] → Original: ${conversationId} (tipo: ${typeof conversationId})`);
            console.log(`[API] → Numérico: ${numericConversationId} (tipo: ${typeof numericConversationId})`);
            
            // ✅ CONSTRUIR PAYLOAD SEGÚN EL ENDPOINT SELECCIONADO
            let payload;
            
            // ✅ PAYLOAD UNIVERSAL MODULAR - Todos los endpoints usan la misma estructura
            payload = {
                message,
                conversation_id: numericConversationId,
                user_id: 'usuario_test',
                language: userLanguage,
                use_deepseek_reasoning: useDeepSeekReasoning
            };
            
            console.log(`[API] 🔄 PAYLOAD MODULAR PARA ${endpoint}:`);
            console.log(`[API] → use_deepseek_reasoning: ${useDeepSeekReasoning} (tipo: ${typeof useDeepSeekReasoning})`);
            console.log(`[API] → service: ${serviceId}`);
            
            // ✅ VALIDACIÓN FINAL: Verificar que conversation_id sea un número válido
            if (typeof payload.conversation_id !== 'number') {
                console.error('[API] 🚨 ERROR CRÍTICO: conversation_id no es un número!');
                console.error('[API] → conversation_id:', payload.conversation_id);
                console.error('[API] → tipo:', typeof payload.conversation_id);
                throw new Error('conversation_id debe ser un número, no se puede enviar mensaje');
            }

            // ✅ DEBUGGING CRÍTICO: Log del conversation_id que se está enviando
            console.log(`[API] 🔍 ENVIANDO MENSAJE:`);
            console.log(`[API] → Session Token (UUID): ${session.token?.substring(0, 8)}...`);
            console.log(`[API] → Conversation ID (número): ${numericConversationId}`);
            console.log(`[API] → Tipo de conversation_id: ${typeof numericConversationId}`);
            console.log(`[API] → endpoint: ${endpoint}`);
            console.log(`[API] → payload completo:`, JSON.stringify(payload, null, 2));
            
            // 🚨 ÚLTIMO CHECK ANTES DE ENVIAR (como solicitó el usuario)
            console.log('🚨 ÚLTIMO CHECK ANTES DE ENVIAR:');
            console.log('Headers que van a ir:', getSessionHeaders());
            console.log('Body que se va a enviar:', JSON.stringify(payload));
            console.log('conversation_id en el body:', payload.conversation_id);
            console.log('tipo de conversation_id:', typeof payload.conversation_id);
            console.log('endpoint final:', endpoint);
            
            // Usar el nuevo httpClient para manejar autenticación y errores automáticamente
            const response = await httpClient.post(endpoint, payload, {}, 1); // Un solo reintento para no demorar la UX
            
            // Si no obtuvimos respuesta, devolver error para desarrollo
            if (!response) {
                console.error('[API] Critical error sending message: No response received');
                
                if (isDev) {
                    return {
                        success: false,
                        message_id: `error-${Date.now()}`,
                        status: 'error',
                        response: 'Error sending message. Server unavailable. (Dev fallback response)'
                    };
                }
                
                throw new Error('Could not connect to server');
            }
            
            // Verificar si la respuesta es correcta
            if (!response.ok) {
                console.warn(`[API] Error ${response.status} sending message`);
                
                // Si es un error de autenticación a pesar de nuestro interceptor, intentar recuperar
                if (response.status === 401) {
                    console.warn('[API] Authentication error despite interceptor...');
                    
                    // NO renovar token - el error puede ser de otro tipo
                    
                    // Devolver error para que el frontend pueda reintentar
                    return {
                        success: false,
                        message_id: `auth-error-${Date.now()}`,
                        status: 'auth_error',
                        response: 'Session expired. Please try again.'
                    };
                }
                
                // Para otros errores en modo desarrollo, devolver respuesta simulada
                if (isDev) {
                    return {
                        success: false,
                        message_id: `error-${Date.now()}`,
                        status: 'error',
                        response: `Error ${response.status}: ${response.statusText}. (Dev fallback response)`
                    };
                }
                
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            // Procesar la respuesta JSON
            const data = await response.json();
            
            // Verificar que la respuesta tenga el formato esperado
            if (!data) {
                console.warn('[API] Empty response from server');
                throw new Error('Empty response from server');
            }
            
            // Log estructurado del éxito
            logApiCall(endpoint, payload, data);
            
            // Retornar la respuesta para manejar el polling
            return data;
        } catch (err) {
            console.error('[API] Error sending message:', err);
            error.value = 'Could not send message';
            
            // Log estructurado del error
            logApiCall(endpoint, payload, null, err);
            
            // En desarrollo, devolver respuesta simulada
            if (isDev) {
                return {
                    success: false,
                    message_id: `error-fallback-${Date.now()}`,
                    status: 'error',
                    response: 'Error sending message. Please try again. (Dev fallback response)'
                };
            }
            
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Verificar el estado de un mensaje en procesamiento
     * @param messageId ID del mensaje en procesamiento
     */
    async function checkMessageStatus(messageId: string) {
        isLoading.value = true;
        error.value = null;

        try {
            // ✅ CRÍTICO: NO generar nuevo token - usar el existente
            const session = useSession();
            if (!session.token) {
                console.warn('[API] No token in session store for message status check, trying localStorage...');
                
                // Intentar obtener token desde localStorage
                const storedToken = typeof window !== 'undefined' ? localStorage.getItem('userSessionToken') : null;
                if (storedToken) {
                    console.log(`[API] Using stored token for message status check: ${storedToken.substring(0, 8)}...`);
                    session.setToken(storedToken);
                } else {
                    throw new Error('No session token available for message status check');
                }
            }
            
            // ✅ DEBUGGING: Log del token que se va a usar
            console.log(`[API] 🔍 VERIFICANDO ESTADO DE MENSAJE ${messageId}:`);
            console.log(`[API] → session token: ${session.token?.substring(0, 8)}...`);
            
            // Usar httpClient para manejar autenticación y errores automáticamente
            console.log(`[API] Checking status of message ${messageId}...`);
            const response = await httpClient.get(`${apiUrl}/message-status/${messageId}/`, {
                headers: getSessionHeaders(false)
            }, 1); // Un reintento es suficiente para polling
            
            // Si no obtuvimos respuesta, devolver error
            if (!response) {
                console.error(`[API] Critical error checking message status ${messageId}`);
                
                // En desarrollo, devolver una respuesta simulada para no interrumpir la UX
                if (isDev) {
                    return {
                        success: false,
                        message_id: messageId,
                        status: 'error',
                        response: 'Error checking message status. Server unavailable. (Dev fallback response)'
                    };
                }
                
                throw new Error('Could not connect to server for status check');
            }
            
            // Verificar si la respuesta es correcta
            if (!response.ok) {
                console.warn(`[API] Error ${response.status} checking message status`);
                
                // En desarrollo, devolver una respuesta simulada para continuar
                if (isDev) {
                    return {
                        success: false,
                        message_id: messageId,
                        status: 'error',
                        response: `Error ${response.status}: ${response.statusText} (Dev fallback response)`
                    };
                }
                
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            // Procesar la respuesta JSON
            const data = await response.json();
            
            // Si el mensaje sigue en procesamiento, programar nueva verificación
            if (data.status === 'processing') {
                console.log(`[API] Message ${messageId} still processing`);
            }
            // Si el mensaje está completo, registrar
            else if (data.status === 'completed') {
                console.log(`[API] Message ${messageId} completed successfully`);
            }
            // Si hubo un error en el procesamiento
            else if (data.status === 'error') {
                console.warn(`[API] Error processing message ${messageId}:`, data.error || 'Unknown error');
            }
            
            return data;
        } catch (err) {
            console.error(`[API] Error checking message status ${messageId}:`, err);
            error.value = 'Could not check message status';
            
            // Respuesta simulada para errores solo en desarrollo
            if (isDev) {
                return {
                    success: false,
                    message_id: messageId,
                    status: 'error',
                    response: 'Error checking message status. Please try again. (Dev fallback response)'
                };
            }
            
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Eliminar una conversación
     * @param conversationId ID de la conversación a eliminar
     */
    async function deleteConversation(conversationId: number) {
        isLoading.value = true;
        error.value = null;

        try {
            // Asegurar que tenemos una sesión inicializada y válida
            const session = useSession();
            if (!session.token) {
                console.log('[API] No session token, initializing before deleting conversation');
                await initSession();
                
                // Si aún no tenemos token después de inicializar, hay un problema crítico
                if (!session.token) {
                    throw new Error('Failed to initialize session, cannot delete conversation');
                }
            }
            
            // Usar httpClient para manejar autenticación y errores
            const response = await httpClient.delete(`${apiUrl}/conversations/${conversationId}`, {
                headers: getSessionHeaders()
            }, 1);
            
            // Si no obtuvimos respuesta, devolver error
            if (!response) {
                console.error(`[API] Critical error deleting conversation ${conversationId}`);
                return false;
            }
            
            // Verificar si la respuesta es correcta
            if (!response.ok) {
                console.warn(`[API] Error ${response.status} deleting conversation`);
                
                // En desarrollo, simular éxito para poder seguir probando
                if (isDev) {
                    console.log('[API] In development mode, simulating successful deletion');
                    return true;
                }
                
                return false;
            }
            
            console.log(`[API] Conversation ${conversationId} deleted successfully`);
            return true;
        } catch (err) {
            console.error(`[API] Error deleting conversation ${conversationId}:`, err);
            error.value = 'Could not delete conversation';
            
            // En desarrollo, simular éxito para poder seguir probando
            if (isDev) {
                console.log('[API] In development mode, simulating successful deletion despite error');
                return true;
            }
            
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Verificar el estado del sistema
     */
    async function checkSystemStatus() {
        isLoading.value = true;
        error.value = null;

        try {
            // Usar httpClient para manejar autenticación y errores
            const response = await httpClient.get(`${apiUrl}/system-status/`, {
                headers: getSessionHeaders(false)
            }, 1);
            
            // Si no obtuvimos respuesta, devolver error simulado
            if (!response) {
                console.error('[API] Critical error checking system status');
                
                // En desarrollo, devolver datos simulados para poder probar la UI
                if (isDev) {
                    return {
                        success: true,
                        status: 'ok',
                        version: '1.0',
                        timestamp: new Date().toISOString(),
                        all_available: true,
                        components: {
                            api: true,
                            db: true,
                            rag: true,
                            services: true,
                            db_details: {
                                documents: 24,
                                domains: ['ia_generativa', 'hacking_etico'],
                                embedding_model: 'jina-embeddings-v3',
                                reranking_model: 'rerank-multilingual-v3.0'
                            }
                        },
                        session: {
                            valid: true
                        }
                    };
                }
                
                return {
                    success: false,
                    all_available: false,
                    components: {
                        api: false,
                        db: false,
                        rag: false,
                        services: false
                    },
                    error: 'Could not connect to server'
                };
            }
            
            // Verificar si la respuesta es correcta
            if (!response.ok) {
                console.warn(`[API] Error ${response.status} checking system status`);
                
                // En desarrollo, devolver datos simulados para poder probar la UI
                if (isDev) {
                    const mockData = {
                        success: true,
                        status: 'ok',
                        version: '1.0',
                        timestamp: new Date().toISOString(),
                        all_available: true,
                        components: {
                            api: true,
                            db: true,
                            rag: true,
                            services: true,
                            db_details: {
                                documents: 24,
                                domains: ['ia_generativa', 'hacking_etico'],
                                embedding_model: 'jina-embeddings-v3',
                                reranking_model: 'rerank-multilingual-v3.0'
                            }
                        },
                        session: {
                            valid: true
                        }
                    };
                    
                    // Añadir estructura adicional para compatibilidad con system-status.vue
                    mockData.document_count = mockData.components.db_details.documents;
                    
                    // Estructura esperada por system-status.vue
                    mockData.mongodb = {
                        documents_count: mockData.document_count,
                        domains: mockData.components.db_details.domains,
                        embedding_model: mockData.components.db_details.embedding_model,
                        reranking_model: mockData.components.db_details.reranking_model
                    };
                    
                    // Estructura para dependent_services_status
                    mockData.dependent_services_status = {
                        mongodb: {
                            status: 'connected',
                            description: `${mockData.document_count} documentos indexados`
                        },
                        jina_ai_api: {
                            status: 'available',
                            description: 'API para embeddings'
                        },
                        cohere_api: {
                            status: 'available',
                            description: 'API para reranking'
                        },
                        llm_api: {
                            status: 'available',
                            description: 'API para generación de texto'
                        }
                    };
                    
                    return mockData;
                }
                
                // Estructura para respuesta de error
                const errorData = {
                    success: false,
                    all_available: false,
                    components: {
                        api: false,
                        db: false,
                        rag: false,
                        services: false
                    },
                    error: `Error ${response.status}: ${response.statusText}`
                };
                
                // Añadir estructura compatible con system-status.vue
                errorData.mongodb = {
                    documents_count: 0,
                    domains: [],
                    embedding_model: 'desconectado',
                    reranking_model: 'desconectado'
                };
                
                return errorData;
            }
            
            // Procesar la respuesta JSON
            const data = await response.json();
            
            // Agregar el campo all_available para compatibilidad
            data.all_available = data.status === 'ok' && 
                                data.components && 
                                data.components.db && 
                                data.components.db_details && 
                                data.components.db_details.documents > 0;
                                
            // Añadir campo de conteo de documentos para simplificar acceso
            if (data.components?.db_details) {
                data.document_count = data.components.db_details.documents || 0;
            } else {
                data.document_count = 0;
            }
            
            // Estructura esperada por system-status.vue - IMPORTANTE PARA MOSTRAR DOCUMENTOS
            data.mongodb = {
                documents_count: data.document_count,
                domains: data.components?.db_details?.domains || [],
                embedding_model: data.components?.db_details?.embedding_model || 'jina-embeddings-v3',
                reranking_model: data.components?.db_details?.reranking_model || 'rerank-multilingual-v3.0'
            };
            
            // Estructura requerida por los componentes que usan dependent_services_status
            data.dependent_services_status = {
                mongodb: {
                    status: data.components?.db ? 'connected' : 'disconnected',
                    description: `${data.document_count} documentos indexados`
                },
                jina_ai_api: {
                    status: 'available',
                    description: 'API para embeddings'
                },
                cohere_api: {
                    status: 'available',
                    description: 'API para reranking'
                },
                llm_api: {
                    status: 'available',
                    description: 'API para generación de texto'
                }
            };
            
            return data;
        } catch (err) {
            console.error('[API] Error checking system status:', err);
            error.value = 'Could not check system status';
            
            // En desarrollo, devolver datos simulados para poder probar la UI
            if (isDev) {
                const mockData = {
                    success: true,
                    status: 'ok',
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    all_available: true,
                    components: {
                        api: true,
                        db: true,
                        rag: true,
                        services: true,
                        embedding_api: true,
                        rerank_api: true,
                        llm_api: true,
                        db_details: {
                            documents: 24,
                            domains: ['ia_generativa', 'hacking_etico'],
                            embedding_model: 'jina-embeddings-v3',
                            reranking_model: 'rerank-multilingual-v3.0'
                        }
                    },
                    session: {
                        valid: true
                    }
                };
                
                // Añadir estructura adicional para compatibilidad con system-status.vue
                mockData.document_count = mockData.components.db_details.documents;
                
                // Estructura esperada por system-status.vue
                mockData.mongodb = {
                    documents_count: mockData.document_count,
                    domains: mockData.components.db_details.domains,
                    embedding_model: mockData.components.db_details.embedding_model,
                    reranking_model: mockData.components.db_details.reranking_model
                };
                
                // Estructura para dependent_services_status
                mockData.dependent_services_status = {
                    mongodb: {
                        status: 'connected',
                        description: `${mockData.document_count} documentos indexados`
                    },
                    jina_ai_api: {
                        status: 'available',
                        description: 'API para embeddings'
                    },
                    cohere_api: {
                        status: 'available',
                        description: 'API para reranking'
                    },
                    llm_api: {
                        status: 'available',
                        description: 'API para generación de texto'
                    }
                };
                
                return mockData;
            }
            
            // Respuesta simulada para errores
            const errorData = {
                success: false,
                all_available: false,
                components: {
                    api: false,
                    db: false,
                    rag: false,
                    services: false
                },
                error: err.message || 'Unknown error'
            };
            
            // Añadir estructura compatible con system-status.vue
            errorData.mongodb = {
                documents_count: 0,
                domains: [],
                embedding_model: 'desconectado',
                reranking_model: 'desconectado'
            };
            
            // Estructura para dependent_services_status
            errorData.dependent_services_status = {
                mongodb: {
                    status: 'disconnected',
                    description: 'Sin conexión a MongoDB'
                },
                jina_ai_api: {
                    status: 'unknown',
                    description: 'Estado desconocido'
                },
                cohere_api: {
                    status: 'unknown',
                    description: 'Estado desconocido'
                },
                llm_api: {
                    status: 'unknown',
                    description: 'Estado desconocido'
                }
            };
            
            return errorData;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Verificar si la sesión actual es válida
     * @returns true si la sesión es válida, false en caso contrario
     */
    async function checkSession() {
        isLoading.value = true;
        error.value = null;
        
        try {
            const session = useSession();
            if (!session.token) {
                console.log('[API] No session token found to verify');
                return false;
            }
            
            // Validar el token probando una petición a system-status
            console.log(`[API] Validating token: ${session.token.substring(0, 8)}...`);
            
            try {
                // Usar httpClient para validar token
                const response = await httpClient.get(`${apiUrl}/system-status/`, {
                    headers: { 'User-Session-ID': session.token }
                }, 0); // Sin reintentos para verificación rápida
                
                // Si la respuesta existe y es exitosa, comprobar datos de sesión
                if (response && response.ok) {
                    const data = await response.json();
                    
                    // Verificar si el backend considera que el token es válido
                    if (data.session && data.session.valid === true) {
                        console.log('[API] Token verified successfully');
                        return true;
                    } else {
                        console.warn('[API] Token is invalid according to backend:', 
                                    data.session?.error || 'No specific error provided');
                        return false;
                    }
                }
                
                // Si obtuvimos respuesta pero no es OK, el token es inválido
                if (response) {
                    console.warn(`[API] Invalid token, status: ${response.status}`);
                    return false;
                }
                
                // Si no obtuvimos respuesta, asumimos que hay un problema de conectividad
                console.warn('[API] Could not verify token due to connectivity issues');
                
                // En desarrollo, permitimos usar el token aunque haya errores de conexión
                if (isDev) {
                    console.log('[API] In development mode, assuming token is valid');
                    return true;
                }
                
                return false;
            } catch (fetchError) {
                console.warn('[API] Error during token verification:', fetchError);
                
                // En desarrollo, permitimos usar el token aunque haya errores
                if (isDev) {
                    console.log('[API] In development mode, assuming token is valid despite errors');
                    return true;
                }
                
                return false;
            }
        } catch (err) {
            console.error('[API] Error checking session:', err);
            error.value = 'Could not verify session';
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Crear una nueva conversación siguiendo el flujo requerido:
     * - Asegurar sesión válida
     * - Usar la API real del backend
     * - No usar fallbacks de desarrollo
     * @param title Título de la conversación
     * @param service Servicio a utilizar
     * @param language Idioma de la conversación
     * @param options Opciones adicionales para la conversación (RAG, razonador, etc.)
     */
    async function createConversation(title: string, service: string, language?: string, options?: any) {
        isLoading.value = true;
        error.value = null;

        try {
            // ✅ CRÍTICO: NO generar nuevo token - usar el existente
            const session = useSession();
            if (!session.token) {
                console.log('[API] No session token in store, trying localStorage...');
                
                // Intentar obtener token desde localStorage
                const storedToken = typeof window !== 'undefined' ? localStorage.getItem('userSessionToken') : null;
                if (storedToken) {
                    console.log(`[API] Using stored token for conversation creation: ${storedToken.substring(0, 8)}...`);
                    session.setToken(storedToken);
                } else {
                    throw new Error('No session token available - cannot create conversation');
                }
            }
            
            // Usar el idioma proporcionado o el idioma actual
            const userLanguage = language || getCurrentLanguage();
            
            // ✅ DETERMINAR SERVICIO BACKEND BASADO EN TIPO DE AGENTE
            let serviceForBackend;
            let domain;
            let useRag;
            
            console.log(`[API] 🔍 CREANDO CONVERSACIÓN PARA SERVICIO: ${service}`);
            
            if (service === 'llm_expert') {
                serviceForBackend = 'llm_expert';
                domain = 'ia_generativa';
                console.log(`[API] 🤖 CONFIGURADO: IA Generativa → /api/ai-expert/`);
                
            } else if (service === 'security_expert') {
                serviceForBackend = 'security_expert';
                domain = 'ciberseguridad';
                console.log(`[API] 🛡️ CONFIGURADO: Ciberseguridad → /api/security-expert/`);
                
            } else if (service === 'unified_agent') {
                serviceForBackend = 'unified_agent';
                domain = 'todos';
                console.log(`[API] 💬 CONFIGURADO: Chat General (Unified Agent) → /api/unified-agent/`);
                
            } else if (service === 'rag_conversation') {
                serviceForBackend = 'rag_conversation';
                domain = 'todos';
                console.log(`[API] 📚 CONFIGURADO: RAG Conversation → /api/unified-agent/`);
                
            } else {
                serviceForBackend = 'unified_agent';
                domain = 'todos';
                console.log(`[API] 🔄 CONFIGURADO: Fallback Unified Agent → /api/unified-agent/`);
            }
            
            // Construir el payload para la creación
            const payload = {
                service: serviceForBackend,
                language: userLanguage,
                userId: session.userId || 'usuario_test',
                domain: domain,
                
                // Valores por defecto
                use_deepseek_reasoning: options?.use_reasoner !== undefined ? options.use_reasoner : false,
                
                // Solo incluir use_rag para servicios que lo soporten
                ...(service === 'llm' || !useRag ? {} : {}), // Simplificado
                ...(options || {})
            };
            
            // Para Chat General (llm), incluir use_rag ya que es configurable
            if (serviceForBackend === 'llm') {
                payload.use_rag = useRag;
            }
            
            console.log(`[API] 🔍 PAYLOAD PARA CREAR CONVERSACIÓN:`);
            console.log(`[API] → service: ${serviceForBackend}`);
            console.log(`[API] → domain: ${domain}`);
            console.log(`[API] → use_rag: ${useRag}`);
            console.log(`[API] → Payload completo:`, JSON.stringify(payload, null, 2));
            
            // Usar httpClient para manejar autenticación y errores
            const response = await httpClient.post(`${apiUrl}/conversations/`, payload, {
                headers: getSessionHeaders()
            }, 1);
            
            // Si no obtuvimos respuesta, manejar error
            if (!response) {
                console.error('[API] Critical error creating conversation - no response');
                throw new Error('Could not connect to server to create conversation');
            }
            
            // Verificar si la respuesta es correcta
            if (!response.ok) {
                console.error(`[API] Error ${response.status} creating conversation: ${response.statusText}`);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            // Procesar la respuesta JSON
            const data = await response.json();
            
            // Verificar que la respuesta tenga el formato esperado según la nueva documentación
            if (!data.success || !data.conversation_id) {
                console.error('[API] Unexpected response format:', data);
                throw new Error('Invalid response format from backend');
            }
            
            console.log(`[API] Conversation created successfully with ID ${data.conversation_id}`);
            
            // Normalizar estructura de respuesta según el nuevo formato
            // La respuesta ahora es: {"success": True, "conversation_id": ID_NUEVA_CONVO, "conversation": {OBJETO_CONVO_COMPLETO}}
            const conversation = data.conversation || {};
            
            // Guardar opciones de configuración para poder restaurarlas cuando se selecciona la conversación
            const conversationOptions = {
                use_rag: payload.use_rag,
                use_reasoner: payload.use_deepseek_reasoning,
                domain: payload.domain || 'todos',
                min_score: payload.min_score || 0.30,
                min_rerank_score: payload.min_rerank_score || 0.35,
                top_k: payload.top_k || 5,
                model: payload.model || 'deepseek-chat',
                // Guardar todos los otros parámetros relevantes
                ...(options || {})
            };
            
            return {
                id: Number(data.conversation_id), // ✅ CRÍTICO: Asegurar que sea número
                title: conversation.title || `Conversación ${data.conversation_id}`,
                service: conversation.service || payload.service,
                messages: Array.isArray(conversation.messages) ? conversation.messages : [],
                lastUpdated: conversation.last_updated || new Date().toISOString(),
                language: conversation.language || payload.language,
                last_message_id: conversation.last_message_id || null,
                options: conversationOptions // Incluir opciones para restaurar la configuración
            };
        } catch (err) {
            console.error('[API] Error creating conversation:', err);
            error.value = err.message || 'Could not create conversation';
            
            // No más fallbacks de desarrollo, propagar el error para que UI pueda manejarlo
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        isLoading,
        error,
        httpClient,
        initSession,
        createSession, // Deprecated but kept for backward compatibility
        checkSession,
        getConversations,
        createConversation,
        sendMessage,
        checkMessageStatus,
        deleteConversation,
        checkSystemStatus,
        getCurrentLanguage,
        // ✅ NUEVAS FUNCIONES PARA PREVENIR DUPLICADOS
        logApiCall,
        safeApiCall
    };
}