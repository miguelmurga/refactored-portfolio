import { defineStore } from 'pinia';
import { useApiService, Conversation, ChatMessage } from '~/composables/useApiService';
import { useConversationController } from '~/composables/useConversationController';
import { getServiceById } from '~/config/services';

// Importante: Importar también el método de getCurrentLanguage
let _getCurrentLanguage: () => string;
const getLanguage = () => {
    // Asegurarnos que tenemos la función disponible (la importamos bajo demanda para evitar circular refs)
    if (!_getCurrentLanguage) {
        _getCurrentLanguage = useApiService().getCurrentLanguage;
    }
    return _getCurrentLanguage();
};

export const useChatStore = defineStore('chat', () => {
    // Estado
    const conversations = ref<Conversation[]>([]);
    const currentConversationId = ref<number | null>(null);
    const isTyping = ref(false);
    const conversationsLoaded = ref(false);
    
    // 🔄 TRIGGER de reactividad para forzar re-render de mensajes
    const messagesUpdateTrigger = ref(0);
    
    // ✅ INSTRUCCIÓN 6: Cambiar estructura de almacenamiento para separar conversaciones
    const messagesByConversation = ref<{[conversationId: string]: ChatMessage[]}>({});
    // ✅ INSTRUCCIÓN 3: Eliminada isCreatingFirstConversation - ya no se crea automáticamente
    const isCreatingNewConversation = ref(false); // Control para evitar creación duplicada cuando el usuario hace clic en Nueva Conversación
    const loadConversationsInProgress = ref(false); // Control de concurrencia para loadConversations
    
    // ✅ INSTRUCCIÓN 2: Variables de control para evitar carga doble
    const isLoadingConversations = ref(false);
    const lastLoadTime = ref(0);
    
    // Estado para respaldo local y caché
    const CONVERSATIONS_CACHE_KEY = 'chatConversationsCache';
    const CURRENT_CONVERSATION_KEY = 'chatCurrentConversationId';

    // API service
    const { isLoading, error, getConversations, createConversation, sendMessage, deleteConversation, initSession, httpClient } = useApiService();
    
    // Conversation controller singleton para evitar duplicados
    const conversationController = useConversationController();
    
    /**
     * ✅ INSTRUCCIÓN 1 y 2: Agregar conversation_id a mensaje y crear función filtro
     */
    function addConversationIdToMessage(message: ChatMessage, conversationId: number): ChatMessage {
        return {
            ...message,
            conversation_id: conversationId // OBLIGATORIO
        };
    }
    
    /**
     * ✅ INSTRUCCIÓN 3: Función para obtener mensajes de una conversación específica
     */
    function getMessagesForConversation(conversationId: number | null): ChatMessage[] {
        if (!conversationId) {
            console.log('[FILTER] No conversation ID provided, returning empty array');
            return [];
        }
        
        const conversation = conversations.value.find(c => c.id === conversationId);
        if (!conversation) {
            console.log(`[FILTER] Conversation ${conversationId} not found`);
            return [];
        }
        
        // Filtrar mensajes por conversation_id
        const messages = conversation.messages.filter(msg => {
            // Si el mensaje no tiene conversation_id, agregarlo automáticamente
            if (!msg.conversation_id) {
                console.log(`[ERROR] No conversation_id found in message ${msg.id}, adding ${conversationId}`);
                msg.conversation_id = conversationId;
            }
            return msg.conversation_id === conversationId;
        });
        
        console.log(`[FILTER] Showing ${messages.length} messages for conversation ${conversationId}`);
        return messages;
    }
    
    /**
     * ✅ INSTRUCCIÓN 5: Limpiar mensajes mostrados antes de navegación
     */
    function clearDisplayedMessages() {
        console.log('[CLEAR] Cleared displayed messages before navigation');
        // Los mensajes se limpiarán automáticamente cuando cambie currentConversationId
        // ya que getMessagesForConversation retornará un array vacío
    }
    
    /**
     * 🔄 FUNCIÓN AUXILIAR: Reordenar mensajes usando la lógica estándar
     * Para mantener consistencia entre todos los lugares donde se añaden mensajes
     */
    function sortMessagesByTimestampAndId(messages: ChatMessage[]): ChatMessage[] {
        return [...messages].sort((a, b) => {
            let timestampA = 0;
            let timestampB = 0;
            
            // Para mensaje A
            if (a.created_at) {
                timestampA = new Date(a.created_at).getTime();
            } else if (a._timestamp) {
                timestampA = new Date(a._timestamp).getTime();
            } else if (a._time) {
                timestampA = typeof a._time === 'number' ? a._time : new Date(a._time).getTime();
            }
            
            // Para mensaje B
            if (b.created_at) {
                timestampB = new Date(b.created_at).getTime();
            } else if (b._timestamp) {
                timestampB = new Date(b._timestamp).getTime();
            } else if (b._time) {
                timestampB = typeof b._time === 'number' ? b._time : new Date(b._time).getTime();
            }
            
            // Si los timestamps son iguales, ordenar por ID
            if (timestampA === timestampB || Math.abs(timestampA - timestampB) < 100) {
                const idA = a.id && !isNaN(Number(a.id)) ? Number(a.id) : 0;
                const idB = b.id && !isNaN(Number(b.id)) ? Number(b.id) : 0;
                return idA - idB;
            }
            
            // Si no hay timestamps válidos, usar ID como fallback
            if (!timestampA && !timestampB) {
                const idA = a.id && !isNaN(Number(a.id)) ? Number(a.id) : 0;
                const idB = b.id && !isNaN(Number(b.id)) ? Number(b.id) : 0;
                return idA - idB;
            }
            if (!timestampA) return 1;
            if (!timestampB) return -1;
            
            return timestampA - timestampB; // Orden ascendente
        });
    }

    /**
     * 🔄 FORZAR ACTUALIZACIÓN COMPLETA de la UI de mensajes
     * Para resolver problemas de orden en tiempo real
     */
    async function forceMessagesUpdate() {
        console.log('[FORCE] Forzando actualización completa de mensajes');
        messagesUpdateTrigger.value++;
        await nextTick();
        await nextTick(); // Doble nextTick para asegurar reactividad
        console.log(`[FORCE] Actualización completa finalizada (trigger: ${messagesUpdateTrigger.value})`);
    }
    
    /**
     * 🚨 ALERTA: Mostrar advertencia sobre conversaciones largas
     * Se muestra SIEMPRE al entrar a una conversación con >4 mensajes
     */
    function checkLongConversationAlert(messageCount: number) {
        const conversationId = currentConversationId.value;
        if (!conversationId || messageCount <= 4) {
            return; // Solo mostrar si >4 mensajes
        }
        
        // Solo en el cliente (no en server-side rendering)
        if (typeof window !== 'undefined') {
            try {
                // Usar useToast de Nuxt UI con traducciones
                const toast = useToast();
                const { $t } = useNuxtApp();
                
                if (toast && $t) {
                    toast.add({
                        title: $t('chat.long_conversation_title'),
                        description: `${$t('chat.long_conversation_description')} ${$t('chat.scientific_reference')}`,
                        icon: 'i-heroicons-exclamation-triangle',
                        color: 'amber',
                        timeout: 8000
                    });
                } else {
                    console.log(`[ALERT] Conversación larga detectada: ${messageCount} mensajes`);
                }
            } catch (error) {
                console.log(`[ALERT] Conversación larga detectada: ${messageCount} mensajes (toast no disponible)`);
            }
        }
    }

    /**
     * 🍪 COOKIE NOTICE: Mostrar aviso de cookies al iniciar nuevas conversaciones
     */
    function showCookieNoticeForNewConversation() {
        // Solo en el cliente (no en server-side rendering)
        if (typeof window !== 'undefined') {
            try {
                // Disparar evento global para mostrar el CookieNotice
                window.dispatchEvent(new CustomEvent('showCookieNotice', {
                    detail: { source: 'newConversation' }
                }));
                console.log('[COOKIE] Cookie notice triggered for new conversation');
            } catch (error) {
                console.log('[COOKIE] Error showing cookie notice:', error);
            }
        }
    }
    
    /**
     * ✅ INSTRUCCIÓN 7: Establecer conversación actual correctamente
     */
    function setCurrentConversationId(id: number) {
        if (typeof id !== 'number' || id <= 0) {
            console.error(`[ERROR] Invalid conversation ID: ${id}`);
            return;
        }
        console.log(`[LOAD] Setting current conversation ID to ${id}`);
        currentConversationId.value = id;
    }
    
    /**
     * Reemplaza un mensaje temporal con la respuesta real del backend
     */
    function replaceTempMessage(tempId: string, realMessage: ChatMessage) {
        if (!currentConversation.value) return;
        
        const messageIndex = currentConversation.value.messages.findIndex(m => 
            m.id === tempId || m._temp_id === tempId
        );
        
        if (messageIndex !== -1) {
            // 🚨 DEBUGGING: Verificar ID del mensaje real
            console.log(`[REPLACE] 🔍 Reemplazando mensaje temporal ${tempId} con:`, {
                realMessageId: realMessage.id,
                realMessageRole: realMessage.role,
                hasValidId: realMessage.id && realMessage.id !== 'undefined'
            });
            
            // ✅ CRÍTICO: Asegurar que el mensaje real tenga un ID válido
            if (!realMessage.id || realMessage.id === 'undefined') {
                console.warn(`[REPLACE] ⚠️ Mensaje real sin ID válido, manteniendo tempId: ${tempId}`);
                realMessage.id = tempId; // Mantener el ID temporal si no hay uno válido
            }
            
            // ✅ INSTRUCCIÓN 1: Agregar conversation_id a mensaje de reemplazo
            const messageWithConversationId = addConversationIdToMessage(realMessage, currentConversation.value.id);
            
            // Preservar algunos metadatos locales si es necesario
            const localMetadata = {
                _timestamp: currentConversation.value.messages[messageIndex]._timestamp,
                _time: currentConversation.value.messages[messageIndex]._time
            };
            
            // Reemplazar con el mensaje real del backend
            currentConversation.value.messages[messageIndex] = {
                ...messageWithConversationId,
                ...localMetadata, // Mantener timestamps locales si el backend no los envía
                _local_status: 'sent' // Marcar como enviado exitosamente
            };
            
            console.log(`[REPLACE] ✅ Reemplazado: ${tempId} → ${messageWithConversationId.id}`);
            saveConversationsToCache();
        } else {
            console.warn(`[REPLACE] ⚠️ No se encontró mensaje temporal con ID: ${tempId}`);
        }
    }
    
    /**
     * Marca un mensaje temporal como fallido
     */
    function markMessageFailed(tempId: string) {
        if (!currentConversation.value) return;
        
        const messageIndex = currentConversation.value.messages.findIndex(m => 
            m.id === tempId || m._temp_id === tempId
        );
        
        if (messageIndex !== -1) {
            currentConversation.value.messages[messageIndex]._local_status = 'failed';
            console.log(`[Chat] Marked temp message ${tempId} as failed`);
            saveConversationsToCache();
        }
    }
    
    /**
     * Añade un mensaje temporal a la conversación actual
     */
    function addTempMessage(message: ChatMessage) {
        if (!currentConversation.value) return;
        
        // ✅ INSTRUCCIÓN 1: Agregar conversation_id al mensaje temporal
        const messageWithConversationId = addConversationIdToMessage(message, currentConversation.value.id);
        
        currentConversation.value.messages.push({
            ...messageWithConversationId,
            _local_status: 'sending'
        });
        
        saveConversationsToCache();
    }

    // Getters
    const currentConversation = computed(() => {
        if (!currentConversationId.value) return null;
        return conversations.value.find(c => c.id === currentConversationId.value) || null;
    });

    /**
     * ✅ FIXED: Computed property que devuelve mensajes SIN reordenar
     * El backend ya envía los mensajes en el orden correcto
     */
    const currentMessages = computed(() => {
        // 🔄 TRIGGER: Forzar reactividad completa
        const _ = messagesUpdateTrigger.value;
        const conversationsTrigger = conversations.value.length; // Dependencia de conversaciones
        
        // ✅ Verificar que currentConversationId esté establecido
        if (!currentConversationId.value) {
            console.log('[FILTER] No current conversation ID, returning empty messages');
            return [];
        }
        
        console.log(`[FILTER] Processing messages for conversation ${currentConversationId.value} (trigger: ${messagesUpdateTrigger.value})`);
        
        // ✅ Usar getMessagesForConversation en lugar de acceso directo
        const messages = getMessagesForConversation(currentConversationId.value);
        
        // ✅ DEBUGGING ADICIONAL REQUERIDO (CLAUDE_DEBUGGING_HISTORY.md)
        console.log('Mensajes del backend (orden original):', messages.map(m => `${m.id}:${m.role}`));
        
        console.log(`[FILTER] 🎯 Returning ${messages.length} messages in EXACT backend order (NO sorting)`);
        return messages; // ✅ NO REORDENAR - El backend ya envía en orden correcto
    });

    // Acciones

    /**
     * Guarda las conversaciones en localStorage como respaldo
     */
    // 🔄 Cache optimizado con debounce para evitar escrituras excesivas
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    function saveConversationsToCache() {
        if (typeof window !== 'undefined') {
            // Debounce: esperar 100ms antes de guardar
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                try {
                    // Solo guardamos si hay conversaciones y si estamos en cliente
                    if (conversations.value && conversations.value.length > 0) {
                        const cache = {
                            timestamp: new Date().toISOString(),
                            conversations: conversations.value,
                            version: '1.0'
                        };
                        
                        localStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(cache));
                        
                        // También guardamos el ID de la conversación actual
                        if (currentConversationId.value) {
                            localStorage.setItem(CURRENT_CONVERSATION_KEY, currentConversationId.value.toString());
                        }
                        
                        console.log(`[Chat] Cached ${conversations.value.length} conversations to localStorage`);
                    }
                } catch (error) {
                    console.error('[Chat] Error saving conversations to cache:', error);
                }
            }, 100);
        }
    }
    
    /**
     * Carga las conversaciones desde el caché local
     * @returns true si se cargaron conversaciones desde el caché
     */
    function loadConversationsFromCache(): boolean {
        if (typeof window !== 'undefined') {
            try {
                const cachedData = localStorage.getItem(CONVERSATIONS_CACHE_KEY);
                
                if (cachedData) {
                    const cache = JSON.parse(cachedData);
                    
                    if (cache.conversations && Array.isArray(cache.conversations) && cache.conversations.length > 0) {
                        console.log(`[Chat] Found ${cache.conversations.length} cached conversations from ${cache.timestamp}`);
                        
                        // Procesar y normalizar los datos para asegurar que tienen la estructura correcta
                        const processedConversations = cache.conversations.map((conv: any) => ({
                            ...conv,
                            id: conv.id || Math.floor(Math.random() * 100000),
                            title: conv.title || 'Sin título',
                            service: conv.service || 'unified_agent',
                            messages: Array.isArray(conv.messages) ? conv.messages : [],
                            lastUpdated: new Date(conv.lastUpdated || conv.last_updated || Date.now()).toISOString(),
                            language: conv.language || 'es'
                        }));
                        
                        conversations.value = processedConversations;
                        
                        // Cargar el ID de la conversación actual si existe
                        const savedCurrentId = localStorage.getItem(CURRENT_CONVERSATION_KEY);
                        if (savedCurrentId) {
                            const currentId = parseInt(savedCurrentId);
                            
                            // Verificar que la conversación existe en la lista cargada
                            if (conversations.value.some(c => c.id === currentId)) {
                                currentConversationId.value = currentId;
                                console.log(`[Chat] Restored current conversation ID: ${currentId}`);
                            }
                        }
                        
                        return true;
                    }
                }
            } catch (error) {
                console.error('[Chat] Error loading conversations from cache:', error);
            }
        }
        
        return false;
    }

    /**
     * Cargar todas las conversaciones desde la API siguiendo el flujo requerido
     * @param forceReload Forzar recarga incluso si ya están cargadas
     * @param maxRetries Número máximo de reintentos en caso de error
     * @returns true si las conversaciones se cargaron correctamente, false en caso contrario
     */
    async function loadConversations(forceReload = false, maxRetries = 2): Promise<boolean> {
        // ✅ INSTRUCCIÓN 2: Verificar si ya hay carga en progreso
        if (isLoadingConversations.value) {
            console.log('[SKIP] Conversations already loading');
            return conversationsLoaded.value;
        }
        
        // ✅ INSTRUCCIÓN 2: Verificar tiempo desde última carga
        const currentTime = Date.now();
        if (!forceReload && currentTime - lastLoadTime.value < 1000) {
            console.log('[SKIP] Too soon since last load, skipping');
            return conversationsLoaded.value;
        }
        
        // Control de concurrencia - evitar peticiones duplicadas
        if (loadConversationsInProgress.value) {
            console.log('[Chat] loadConversations already in progress, skipping...');
            return conversationsLoaded.value;
        }
        
        // Si ya están cargadas y no se fuerza la recarga, retornamos exitosamente
        if (conversationsLoaded.value && !forceReload) {
            console.log('[SKIP] Conversations already loaded');
            return true;
        }

        // ✅ INSTRUCCIÓN 2: Establecer flags de carga
        isLoadingConversations.value = true;
        loadConversationsInProgress.value = true;
        isLoading.value = true;
        lastLoadTime.value = currentTime;
        
        // PASO 1: Asegurar sesión válida antes de cargar conversaciones
        try {
            // ✅ CRÍTICO: NO llamar initSession aquí - solo verificar que existe token
            const session = useSession();
            if (!session.token) {
                console.log('[Chat] No session token available, trying to load from storage...');
                
                // Intentar cargar token desde localStorage (NO generar nuevo)
                const storedToken = typeof window !== 'undefined' ? localStorage.getItem('userSessionToken') : null;
                if (storedToken) {
                    console.log('[Chat] Found stored token, using it:', storedToken.substring(0, 8) + '...');
                    session.setToken(storedToken);
                    session.isSessionInitialized = true;
                } else {
                    console.error('[Chat] No session token available and none in storage - cannot load conversations');
                    isLoading.value = false;
                    return false;
                }
            }
            
            console.log(`[Chat] Using session token: ${session.token.substring(0, 8)}...`);
            
            // PASO 2: Cargar conversaciones reales del backend
            console.log('[Chat] Loading conversations from backend...');
            
            // Variables para el mecanismo de reintentos
            let retryCount = 0;
            let success = false;
            
            while (retryCount <= maxRetries && !success) {
                try {
                    // Si no es el primer intento, agregar un pequeño retraso exponencial
                    if (retryCount > 0) {
                        const delay = 300 * Math.pow(2, retryCount - 1); // 300ms, 600ms, 1200ms, etc.
                        console.log(`[Chat] Retry ${retryCount}/${maxRetries} after ${delay}ms delay`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                    
                    console.log(`[Chat] Loading conversations from API (attempt ${retryCount + 1}/${maxRetries + 1})...`);
                    const data = await getConversations();
                    
                    // Verificar si recibimos un error o un arreglo vacío
                    if (!data) {
                        console.error('[Chat] No data received from API, retrying...');
                        retryCount++;
                        continue;
                    }
                    
                    if (!Array.isArray(data)) {
                        console.error('[Chat] Invalid response format from API:', data);
                        retryCount++;
                        continue;
                    }
                    
                    // Procesamos las conversaciones recibidas con normalización de datos
                    const processedConversations = data.map((conv: any) => {
                        // 🔍 DEBUGGING: Verificar orden de mensajes al cargar conversaciones
                        if (Array.isArray(conv.messages) && conv.messages.length > 0) {
                            console.log(`[LOAD] Conversación ${conv.id} tiene ${conv.messages.length} mensajes en orden:`);
                            conv.messages.forEach((msg, idx) => {
                                console.log(`[LOAD] Mensaje #${idx+1}: Role=${msg.role}, Timestamp=${msg.created_at || msg._timestamp}`);
                            });
                        }
                        
                        // 🔍 DEBUGGING: Mostrar orden que viene del backend
                        if (Array.isArray(conv.messages) && conv.messages.length > 0) {
                            console.log(`[LOAD] 🎯 BACKEND ENVIÓ CONVERSACIÓN ${conv.id} con mensajes en este orden:`);
                            conv.messages.forEach((msg, idx) => {
                                console.log(`[LOAD] ${idx+1}. ID=${msg.id}, Role=${msg.role}, Content="${msg.content?.substring(0, 30)}..."`);
                            });
                        }

                        return {
                            ...conv,
                            id: conv.id,
                            title: conv.title || 'Sin título',
                            service: conv.service || 'unified_agent',
                            messages: Array.isArray(conv.messages) ? [...conv.messages] : [], // ✅ Preservar EXACTAMENTE el orden del backend
                            lastUpdated: new Date(conv.lastUpdated || conv.last_updated || Date.now()).toISOString(),
                            language: conv.language || 'es'
                        };
                    });
                    
                    // Actualizar las conversaciones en el store
                    conversations.value = processedConversations;
                    
                    // Guardar en caché local para respaldo
                    saveConversationsToCache();
                    
                    console.log(`[Chat] ${conversations.value.length} conversations loaded successfully`);
                    // IMPORTANTE: Marcar las conversaciones como cargadas ANTES de hacer otra lógica
                    // para evitar condiciones de carrera
                    conversationsLoaded.value = true;
                    success = true;
                    
                    // Notificar explícitamente que las conversaciones están listas
                    console.log(`[CONVERSATION-LOAD] Conversations loaded and stored successfully. count=${conversations.value.length}, conversationsLoaded=${conversationsLoaded.value}`);
                    
                    // Log detallado de conversaciones para depuración
                    console.log('[CONVERSATION-LOAD] Conversation IDs loaded:', conversations.value.map(c => c.id).join(', '));
                    
                    // ✅ INSTRUCCIÓN 3: ELIMINADA la creación automática de primera conversación
                    // Permitir que el usuario navegue con 0 conversaciones y las cree manualmente
                    if (conversations.value.length === 0) {
                        console.log('[Chat] No conversations found - user will create manually');
                        conversationsLoaded.value = true; // Marcar como cargadas aunque esté vacío
                    }
                    // Si hay conversaciones, pero ninguna seleccionada, seleccionar la más reciente
                    else if (conversations.value.length > 0 && !currentConversationId.value) {
                        // Primero intentamos cargar del localStorage
                        const savedCurrentId = localStorage.getItem(CURRENT_CONVERSATION_KEY);
                        if (savedCurrentId) {
                            const currentId = parseInt(savedCurrentId);
                            
                            // Verificar que la conversación existe en la lista cargada
                            if (conversations.value.some(c => c.id === currentId)) {
                                currentConversationId.value = currentId;
                                console.log(`[Chat] Restored current conversation ID from localStorage: ${currentId}`);
                            }
                        }
                        
                        // Si no se pudo restaurar, seleccionar la más reciente
                        if (!currentConversationId.value) {
                            const sorted = [...conversations.value].sort((a, b) => 
                                new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
                                
                            console.log('[Chat] Auto-selecting most recent conversation:', sorted[0].id);
                            currentConversationId.value = sorted[0].id;
                            
                            // Guardar en localStorage
                            if (typeof window !== 'undefined') {
                                localStorage.setItem(CURRENT_CONVERSATION_KEY, currentConversationId.value.toString());
                            }
                        }
                    }
                    
                    return true;
                } catch (err) {
                    console.error(`[Chat] Error loading conversations (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
                    retryCount++;
                    
                    // Si hemos agotado los reintentos, fallar explícitamente
                    // Ya no usamos fallbacks para respetar el flujo correcto
                    if (retryCount > maxRetries) {
                        console.error('[Chat] Max retries reached, cannot load conversations');
                        isLoading.value = false;
                        return false;
                    }
                }
            }
            
            // Finalmente, retornar resultado
            console.log(`[Chat] Returning from loadConversations with result=${success}, conversationsLoaded=${conversationsLoaded.value}`);
            return success;
            
        } catch (error) {
            console.error('[Chat] Critical error in conversation loading flow:', error);
            return false;
        } finally {
            // ✅ INSTRUCCIÓN 2: Limpiar todos los flags de carga
            isLoading.value = false;
            isLoadingConversations.value = false;
            loadConversationsInProgress.value = false;
        }
    }

    /**
     * Seleccionar una conversación y configurar la UI correctamente con sus datos
     */
    function selectConversation(id: number) {
        console.log(`[Chat] Selecting conversation ID: ${id}`);
        
        // Buscar la conversación completa en la lista
        const selectedConversation = conversations.value.find(c => c.id === id);
        if (!selectedConversation) {
            console.error(`[Chat] Error: Conversation ID ${id} not found in list`);
            return;
        }
        
        // Establecer como conversación activa
        currentConversationId.value = id;
        
        // Guardar el ID seleccionado en localStorage para persistencia
        if (typeof window !== 'undefined') {
            localStorage.setItem(CURRENT_CONVERSATION_KEY, id.toString());
            console.log(`[Chat] Current conversation ID ${id} saved to localStorage`);
        }
        
        // 🚨 ALERTA: Las conversaciones largas se manejan en ChatMessages.vue
        
        // IMPORTANTE: Configurar opciones globales según los datos de esta conversación
        // Esto es necesario para que los selectores de servicio, idioma, etc. muestren los valores correctos
        
        console.log(`[Chat] Configuration updated for conversation:`, {
            service: selectedConversation.service,
            language: selectedConversation.language,
            id: selectedConversation.id
        });
    }

    /**
     * Crear una nueva conversación
     * @param serviceId ID del servicio a utilizar
     * @param language Idioma opcional para la conversación
     * @param options Opciones adicionales (RAG, razonador, etc)
     */
    async function startNewConversation(serviceId: string, language?: string, options?: any) {
        const requestId = `start-new-${Date.now()}`;
        console.log(`[Chat][${requestId}] Starting new conversation with service '${serviceId}'${language ? ` in language '${language}'` : ''}`);
        
        // ✅ USAR CONVERSATION CONTROLLER EN LUGAR DE LLAMADAS DIRECTAS
        // Verificar si ya hay una creación en curso
        if (conversationController.isCreating()) {
            console.log(`[Chat][${requestId}] Conversation creation already in progress, skipping...`);
            return null;
        }
        
        try {
            // Obtener ID de API del servicio desde la configuración
            const service = getServiceById(serviceId);
            if (!service) {
                console.error(`[Chat][${requestId}] Service '${serviceId}' not found in configuration`);
                return null;
            }
            
            // Desactivar conversación actual antes de crear una nueva
            const oldConversationId = currentConversationId.value;
            currentConversationId.value = null;
            
            // Preparar opciones según el tipo de servicio
            const serviceOptions = {
                language: language || getLanguage(),
                use_rag: true,
                use_deepseek_reasoning: false,
                domain: service.apiId === 'security_expert' ? 'ciberseguridad' : 
                       (service.apiId === 'ia_generativa' || service.apiId === 'ai_expert') ? 'ia_generativa' : 'todos',
                title: `Nueva conversación ${service.name}`,
                // Combinar con las opciones proporcionadas
                ...(options || {})
            };
            
            console.log(`[Chat][${requestId}] Creating conversation with controller:`, JSON.stringify(serviceOptions, null, 2));
            
            // ✅ USAR CONVERSATION CONTROLLER - NUNCA LLAMADAS DIRECTAS
            const newConversation = await conversationController.createNewConversation(service.apiId, serviceOptions);
            
            if (newConversation) {
                // ✅ PERSISTIR CONFIGURACIÓN RAG EN LA CONVERSACIÓN
                const useRag = serviceOptions.use_rag !== undefined ? serviceOptions.use_rag : true;
                
                // Normalizar la estructura (el backend puede usar last_updated en lugar de lastUpdated)
                const conversation = {
                    ...newConversation,
                    lastUpdated: new Date(newConversation.lastUpdated || newConversation.last_updated || Date.now()).toISOString(),
                    messages: newConversation.messages || [],
                    language: newConversation.language || language || null,
                    // ✅ GUARDAR CONFIGURACIÓN RAG BASADA EN TIPO DE SERVICIO
                    ragConfig: (() => {
                        const serviceId = service.id;
                        
                        if (serviceId === 'ia_generativa') {
                            return {
                                use_rag: true,
                                endpoint: '/api/llm-expert/',
                                service_backend: 'ia_generativa',
                                agent_type: 'ia_generativa'
                            };
                        } else if (serviceId === 'security_expert') {
                            return {
                                use_rag: true,
                                endpoint: '/api/security-expert/',
                                service_backend: 'security_expert',
                                agent_type: 'security_expert'
                            };
                        } else if (serviceId === 'rag_conversation') {
                            return {
                                use_rag: true,
                                endpoint: '/api/rag-conversation/',
                                service_backend: 'rag_conversation',
                                agent_type: 'rag_conversation'
                            };
                        } else {
                            // Chat general - RAG configurable
                            return {
                                use_rag: useRag,
                                endpoint: '/api/chat/',
                                service_backend: 'llm',
                                agent_type: 'chat_general'
                            };
                        }
                    })()
                };
                
                console.log(`[Chat] 🔍 CONVERSACIÓN CREADA CON RAG CONFIG:`);
                console.log(`[Chat] → agent_type: ${conversation.ragConfig.agent_type}`);
                console.log(`[Chat] → use_rag: ${conversation.ragConfig.use_rag}`);
                console.log(`[Chat] → endpoint futuro: ${conversation.ragConfig.endpoint}`);
                console.log(`[Chat] → service_backend: ${conversation.ragConfig.service_backend}`);
                
                // Si el servicio tiene un mensaje de bienvenida, agregarlo
                // Asegurar que el mensaje tiene un timestamp y otros campos necesarios
                if (service.welcomeMessage && (!conversation.messages || conversation.messages.length === 0)) {
                    const now = new Date();
                    conversation.messages = [{
                        id: Date.now(),
                        role: 'assistant',
                        content: service.welcomeMessage,
                        created_at: now.toISOString(),
                        _timestamp: now.toISOString(),
                        _time: now.getTime()
                    }];
                }
                
                console.log(`[Chat] Conversación creada con ID ${conversation.id}, agregando al store...`);
                
                // 🚨 DEBUGGING: Verificar que el ID sea numérico al almacenar
                console.log('🔍 VERIFICACIÓN AL ALMACENAR CONVERSACIÓN:');
                console.log('→ conversation.id antes de almacenar:', conversation.id);
                console.log('→ tipo:', typeof conversation.id);
                console.log('→ es número?', typeof conversation.id === 'number');
                
                // ✅ ASEGURAR QUE EL ID SIEMPRE SEA NUMÉRICO
                if (typeof conversation.id !== 'number') {
                    console.warn('🚨 CONVIRTIENDO ID A NÚMERO:', conversation.id);
                    conversation.id = Number(conversation.id);
                    console.log('→ convertido a:', conversation.id, 'tipo:', typeof conversation.id);
                }
                
                conversations.value.push(conversation);
                
                // Añadir pequeño delay antes de cambiar conversación activa para evitar problemas de actualización
                await new Promise(resolve => setTimeout(resolve, 50));
                currentConversationId.value = conversation.id;
                
                // 🍪 MOSTRAR COOKIE NOTICE AL CREAR NUEVA CONVERSACIÓN
                showCookieNoticeForNewConversation();
                
                // Guardar en caché local para respaldo
                saveConversationsToCache();
                
                return conversation.id;
            } else {
                console.error(`[Chat] Error: la API devolvió una conversación vacía o inválida`);
                // Restaurar conversación anterior si hay error
                currentConversationId.value = oldConversationId;
                return null;
            }
        } catch (err) {
            console.error('[Chat] Error creando conversación:', err);
            return null;
        } finally {
            // Desactivar semáforo en TODOS los casos (éxito o error)
            isCreatingNewConversation.value = false;
            console.log(`[Chat] Desbloqueando creación de conversaciones (isCreatingNewConversation=false)`);
        }
    }

    /**
     * Enviar un mensaje a la conversación actual con la implementación precisa del ciclo de vida detallado
     * Este método sigue estrictamente el ciclo D.1 - D.4 descrito en la guía del frontend
     * @param content El contenido del mensaje a enviar
     * @param options Opciones adicionales para configurar el comportamiento del mensaje
     */
    async function sendChatMessage(
        content: string, 
        options?: {
            domain?: string,             // Dominio de conocimiento para RAG
            similarity_metric?: 'cosine' | 'euclidean',  // Métrica de similitud
            use_mmr?: boolean,          // Usar Maximal Marginal Relevance
            use_rerank?: boolean,        // Usar reranking
            min_score?: number,          // Umbral mínimo de similitud
            min_rerank_score?: number,   // Umbral mínimo de reranking
            top_k?: number,              // Número de resultados
            use_rag?: boolean,           // Activar/desactivar RAG
            use_reasoner?: boolean,      // Activar/desactivar razonador
            model?: string,              // Modelo LLM a usar
            language?: string            // Idioma explícito para este mensaje (es, en, pt)
        }
    ) {
        if (!currentConversation.value) return false;

        // Crear ID único temporal siguiendo el patrón recomendado
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        
        // ✅ INSTRUCCIÓN 1: Añadir mensaje del usuario con conversation_id
        const userMessage: ChatMessage = addConversationIdToMessage({
            id: tempId,
            role: 'user',
            content,
            // Añadir metadatos para seguimiento y ordenamiento cronológico
            _local_status: 'sending', // Estado de envío local para seguimiento
            _timestamp: new Date().toISOString(), // Timestamp local para ordenamiento
            created_at: new Date().toISOString(), // Timestamp compatible con backend
            _time: Date.now(), // Timestamp numérico para facilitar ordenamiento
            _temp_id: tempId // Guardar el ID temporal para poder reemplazarlo después
        }, currentConversation.value.id);

        // ✅ FIX CRÍTICO: Aplicar la misma lógica de reordenamiento al mensaje del usuario
        if (currentConversation.value) {
            currentConversation.value.messages.push(userMessage);
            
            // 🔄 REORDENAR INMEDIATAMENTE usando la función auxiliar estándar
            currentConversation.value.messages = sortMessagesByTimestampAndId(currentConversation.value.messages);
            currentConversation.value.lastUpdated = new Date().toISOString();

            // Actualizar título si es el primer mensaje
            if (currentConversation.value.messages.length === 1) {
                currentConversation.value.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
            }
            
            console.log(`[Chat] ✅ Mensajes reordenados después de añadir mensaje del usuario`);
            
            // 🔄 FORZAR REACTIVIDAD inmediatamente después de añadir mensaje
            messagesUpdateTrigger.value++;
            
            // Guardar en caché inmediatamente para preservar el mensaje del usuario
            // incluso si la respuesta del servidor falla
            saveConversationsToCache();
        }

        // Indicar que estamos esperando respuesta
        isTyping.value = true;

        try {
            // ✅ DEBUGGING CRÍTICO: Verificar conversation_id antes de enviar
            const conversationId = currentConversation.value.id;
            
            // 🚨 DEBUGGING ESPECÍFICO: Verificar exactamente qué tipo de ID tenemos
            console.log('🔍 VERIFICACIÓN DEL ID DE CONVERSACIÓN:');
            console.log('→ currentConversation.value.id:', currentConversation.value.id);
            console.log('→ tipo de currentConversation.value.id:', typeof currentConversation.value.id);
            console.log('→ conversationId asignado:', conversationId);
            console.log('→ tipo de conversationId:', typeof conversationId);
            console.log('→ conversationId es número?', typeof conversationId === 'number');
            console.log('→ conversationId es UUID?', typeof conversationId === 'string' && conversationId.includes('-'));
            
            // ✅ USAR CONFIGURACIÓN ACTUAL PASADA COMO PARÁMETRO (NO LA GUARDADA)
            const serviceForMessage = currentConversation.value.service;
            
            console.log('[Chat] 🔍 PREPARANDO ENVÍO DE MENSAJE:');
            console.log(`[Chat] → conversation_id: ${conversationId}`);
            console.log(`[Chat] → currentConversationId.value: ${currentConversationId.value}`);
            console.log(`[Chat] → service_backend: ${serviceForMessage}`);
            console.log(`[Chat] → options recibidas:`, options);
            console.log(`[Chat] → mensaje: "${content}"`);
            
            // 🎯 DEBUGGING: Verificar SERVICIO y ENDPOINT esperado para los 3 servicios
            if (serviceForMessage === 'ia_generativa') {
                console.log(`[Chat] 🤖 SERVICIO: IA Generativa → debería usar /api/llm-expert/`);
            } else if (serviceForMessage === 'security_expert') {
                console.log(`[Chat] 🛡️ SERVICIO: Ciberseguridad → debería usar /api/security-expert/`);
            } else if (serviceForMessage === 'llm') {
                console.log(`[Chat] 💬 SERVICIO: Chat General → debería usar /api/chat/`);
            } else {
                console.log(`[Chat] ❓ SERVICIO DESCONOCIDO: ${serviceForMessage}`);
            }
            
            if (!conversationId || conversationId <= 0) {
                console.error('[Chat] ERROR CRÍTICO: conversation_id inválido antes de enviar mensaje');
                throw new Error('conversation_id inválido');
            }
            
            // ✅ USAR OPCIONES ACTUALES TAL COMO LLEGAN
            const finalOptions = {
                ...options
            };
            
            console.log('[Chat] 🔍 ENVIANDO MENSAJE CON CONFIGURACIÓN:');
            console.log(`[Chat] → Opciones finales:`, finalOptions);
            
            // ✅ DEBUGGING ESPECÍFICO SOLICITADO: Verificar exactamente qué se va a enviar
            console.log('🚨 ANTES DE ENVIAR:');
            console.log('conversation_id que voy a enviar:', conversationId);
            console.log('tipo:', typeof conversationId);
            
            // También verificar session token para asegurar que no se confundan
            const session = useSession();
            console.log('session_id (para headers):', session.token);
            console.log('✅ VERIFICATION: conversation_id !== session_id:', conversationId !== session.token);
            
            console.log('[Chat] Enviando mensaje a través del servicio API...');
            const response = await sendMessage(
                conversationId,
                content,
                serviceForMessage, // ✅ Usar service_backend de ragConfig
                finalOptions
            );

            // Actualizar el estado del mensaje del usuario para indicar que se envió correctamente
            if (currentConversation.value) {
                const userMessageIndex = currentConversation.value.messages.findIndex(
                    m => m.role === 'user' && m.content === content && m._local_status === 'sending'
                );
                
                if (userMessageIndex !== -1) {
                    currentConversation.value.messages[userMessageIndex]._local_status = 'sent';
                }
            }

            // Verificar si la respuesta está en procesamiento asíncrono
            if (response && response.status === "processing" && response.message_id) {
                console.log(`[Chat] Mensaje en procesamiento asíncrono. ID: ${response.message_id}`);
                
                // Guardar el ID del mensaje para poder consultarlo más tarde
                const result = {
                    message_id: response.message_id,
                    id: response.message_id,
                    status: response.status,
                    check_status_endpoint: response.check_status_endpoint || `/api/message-status/${response.message_id}/`
                };
                
                // Actualizar el caché con el estado actual
                saveConversationsToCache();
                
                // Devolver el ID para que la UI sepa que debe consultar el estado
                return result;
            }
            // Si la respuesta es inmediata
            else if (response && (response.assistant_message || response.response || response.messages)) {
                console.log(`[Chat] Respuesta inmediata recibida:`, response);
                
                // 🎯 PRINCIPIO FUNDAMENTAL: Backend messages array = SINGLE SOURCE OF TRUTH
                // Si el backend devuelve un array completo de mensajes, usarlo como verdad absoluta
                if (response.messages && Array.isArray(response.messages) && response.messages.length > 0) {
                    console.log(`[Chat] Respuesta inmediata incluye array completo de ${response.messages.length} mensajes. Usando como fuente única de verdad.`);
                    
                    // 🕒 DEBUGGING CRÍTICO: Orden exacto que envía el backend
                    console.log(`[Chat] 🎯 BACKEND ENVIÓ ${response.messages.length} MENSAJES EN ESTE ORDEN:`);
                    response.messages.forEach((msg, idx) => {
                        const timestamp = msg.created_at || msg._timestamp || 'Sin timestamp';
                        console.log(`[Chat] ${idx+1}. Role=${msg.role}, ID=${msg.id}, Timestamp=${timestamp}, Content="${msg.content?.substring(0, 50)}..."`);
                    });
                    console.log(`[Chat] 🎯 FIN DEL ORDEN DEL BACKEND`);
                    
                    // 🧹 LIMPIAR: Remover cualquier mensaje temporal antes de reemplazar con la verdad del backend
                    console.log(`[Chat] 🧹 Limpiando mensajes temporales antes del reemplazo`);
                    console.log(`[Chat] Mensajes antes de limpiar: ${currentConversation.value.messages.length}`);
                    
                    // 🗑️ CRÍTICO: Eliminar TODOS los mensajes temporales/locales antes del reemplazo
                    // El backend es la ÚNICA fuente de verdad - no conservar NADA local
                    const tempMessagesBefore = currentConversation.value.messages.filter(m => m._temp_id || m._local_status === 'sending');
                    if (tempMessagesBefore.length > 0) {
                        console.log(`[Chat] 🗑️ Eliminando ${tempMessagesBefore.length} mensajes temporales:`, tempMessagesBefore.map(m => ({ id: m.id, role: m.role, temp_id: m._temp_id })));
                    }
                    
                    // ✅ REEMPLAZAR completamente el historial con la respuesta del backend
                    const messagesWithConversationId = response.messages.map(msg => {
                        const messageWithId = addConversationIdToMessage(msg, currentConversation.value!.id);
                        return {
                            ...messageWithId,
                            _timestamp: msg._timestamp || msg.created_at || new Date().toISOString(),
                            _local_status: msg.role === 'user' ? 'sent' : 'received'
                        };
                    });
                    
                    // 🔄 ESTRATEGIA RADICAL: Recrear completamente la conversación para forzar reactividad
                    const updatedConversation = {
                        ...currentConversation.value,
                        messages: [...messagesWithConversationId], // Nuevo array
                        lastUpdated: new Date().toISOString()
                    };
                    
                    // 🔄 REEMPLAZAR la conversación completa en el array de conversaciones
                    const convIndex = conversations.value.findIndex(c => c.id === currentConversation.value.id);
                    if (convIndex !== -1) {
                        // 🔄 FORZAR REACTIVIDAD: Recrear el array completo de conversaciones
                        const newConversations = [...conversations.value];
                        newConversations[convIndex] = updatedConversation;
                        conversations.value = newConversations;
                    }
                    
                    // 🔄 ACTIVAR TRIGGER para forzar re-evaluación del computed
                    messagesUpdateTrigger.value++;
                    
                    // 🔄 ESPERAR A QUE VUE PROCESE LOS CAMBIOS
                    await nextTick();
                    
                    // 🔄 SEGUNDO NEXTICK: Doble asegurar la reactividad (fix para problemas de timing)
                    await nextTick();
                    
                    // 🔍 VERIFICACIÓN INMEDIATA: Confirmar que el orden se preservó después del reemplazo
                    console.log(`[Chat] 🔍 VERIFICANDO ORDEN DESPUÉS DEL REEMPLAZO:`);
                    currentConversation.value.messages.forEach((msg, idx) => {
                        const timestamp = msg.created_at || msg._timestamp || 'Sin timestamp';
                        console.log(`[Chat] ${idx+1}. Role=${msg.role}, ID=${msg.id}, Timestamp=${timestamp}, Content="${msg.content?.substring(0, 50)}..."`);
                    });
                    console.log(`[Chat] 🔍 FIN DE VERIFICACIÓN POST-REEMPLAZO`);
                    
                    // Guardar en caché
                    saveConversationsToCache();
                    
                    console.log(`[Chat] ✅ Historial completamente actualizado desde backend con ${messagesWithConversationId.length} mensajes`);
                    
                    // 🔄 FORZAR ACTUALIZACIÓN FINAL DE LA UI
                    await forceMessagesUpdate();
                    
                    // 🚨 ALERTA: Las conversaciones largas se manejan en ChatMessages.vue
                    
                    return {
                        id: response.message_id || messagesWithConversationId[messagesWithConversationId.length - 1]?.id,
                        status: 'completed'
                    };
                }
                // Si no hay array completo, usar la lógica individual (fallback)
                else {
                    const responseContent = response.assistant_message || response.response || 'No se recibió respuesta del servidor';
                    
                    console.log(`[Chat] Respuesta inmediata sin array completo. Usando lógica individual de fallback.`);
                    
                    // Marcar mensaje temporal como enviado exitosamente
                    replaceTempMessage(tempId, {
                        ...userMessage,
                        id: response.user_message_id || userMessage.id,
                        _local_status: 'sent'
                    });
                    
                    // ✅ INSTRUCCIÓN 1: Añadir la respuesta del asistente con conversation_id
                    const assistantMessage: ChatMessage = addConversationIdToMessage({
                        id: response.message_id || `assistant-${Date.now()}`,
                        role: 'assistant',
                        content: responseContent,
                        context_data: response.context_data || response.search_results || response.sources || null,
                        message_id: response.message_id,
                        // Asegurar que siempre hay timestamps para ordenamiento cronológico
                        created_at: response.created_at || new Date().toISOString(),
                        // Añadir metadatos para seguimiento
                        _local_status: 'received',
                        _timestamp: new Date().toISOString(),
                        // Añadir timestamp numérico para facilitar ordenamiento
                        _time: Date.now()
                    }, currentConversation.value.id);

                    // ✅ FIX CRÍTICO: No usar .push() - reordenar toda la conversación
                    if (currentConversation.value) {
                        // Añadir el mensaje del asistente
                        currentConversation.value.messages.push(assistantMessage);
                        
                        // 🔄 REORDENAR INMEDIATAMENTE usando la función auxiliar estándar
                        currentConversation.value.messages = sortMessagesByTimestampAndId(currentConversation.value.messages);
                        currentConversation.value.lastUpdated = new Date().toISOString();
                        
                        console.log(`[Chat] ✅ Mensajes reordenados después de añadir respuesta individual`);
                        
                        // 🔄 FORZAR REACTIVIDAD
                        messagesUpdateTrigger.value++;
                        
                        // Actualizar caché con el nuevo mensaje
                        saveConversationsToCache();
                    }

                    return {
                        id: assistantMessage.id,
                        status: 'completed'
                    };
                }
            } else {
                console.warn('[Chat] Respuesta del servidor en formato inesperado:', response);
                
                // Marcar el mensaje temporal como fallido
                markMessageFailed(tempId);
                
                return false;
            }
        } catch (err) {
            console.error('[Chat] Error enviando mensaje:', err);
            
            // Marcar el mensaje temporal como fallido
            markMessageFailed(tempId);
            
            return false;
        } finally {
            isTyping.value = false;
        }
    }

    /**
     * Añadir un mensaje de usuario a la conversación actual
     * (Usado para búsquedas semánticas y otras operaciones)
     */
    async function addUserMessage(content: string) {
        if (!currentConversation.value) return false;

        const now = new Date();
        // ✅ INSTRUCCIÓN 1: Añadir conversation_id al mensaje de usuario
        const userMessage: ChatMessage = addConversationIdToMessage({
            id: Date.now(),
            role: 'user',
            content,
            // Añadir metadatos para ordenamiento cronológico
            _timestamp: now.toISOString(),
            created_at: now.toISOString(),
            _time: Date.now()
        }, currentConversation.value.id);

        if (currentConversation.value) {
            currentConversation.value.messages.push(userMessage);
            
            // 🔄 REORDENAR INMEDIATAMENTE para mantener orden cronológico
            currentConversation.value.messages = sortMessagesByTimestampAndId(currentConversation.value.messages);
            currentConversation.value.lastUpdated = now.toISOString();
            
            // Actualizar título si es el primer mensaje
            if (currentConversation.value.messages.length === 1) {
                currentConversation.value.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
            }
            
            // Guardar en caché para preservar el mensaje
            saveConversationsToCache();
        }

        return true;
    }

    /**
     * Añadir un mensaje del asistente a la conversación actual
     * (Usado para búsquedas semánticas y otras operaciones)
     */
    async function addAssistantMessage(message: {content: string, context_data?: any[]}) {
        if (!currentConversation.value) return false;

        const now = new Date();
        // ✅ INSTRUCCIÓN 1: Añadir conversation_id al mensaje del asistente
        const assistantMessage: ChatMessage = addConversationIdToMessage({
            id: Date.now(),
            role: 'assistant',
            content: message.content,
            context_data: message.context_data || null,
            // Añadir metadatos para ordenamiento cronológico
            _timestamp: now.toISOString(),
            created_at: now.toISOString(),
            _time: Date.now()
        }, currentConversation.value.id);

        if (currentConversation.value) {
            currentConversation.value.messages.push(assistantMessage);
            
            // 🔄 REORDENAR INMEDIATAMENTE para mantener orden cronológico
            currentConversation.value.messages = sortMessagesByTimestampAndId(currentConversation.value.messages);
            currentConversation.value.lastUpdated = now.toISOString();
            
            // Guardar en caché para preservar el mensaje
            saveConversationsToCache();
        }

        return true;
    }

    /**
     * Establecer el estado de escritura (typing)
     */
    function setTyping(status: boolean) {
        isTyping.value = status;
    }

    /**
     * Eliminar una conversación
     */
    async function removeConversation(id: number) {
        const success = await deleteConversation(id);

        if (success) {
            // Actualizar localmente
            conversations.value = conversations.value.filter(c => c.id !== id);

            // Si era la conversación actual, resetear
            if (currentConversationId.value === id) {
                currentConversationId.value = null;
                
                // Limpiar del localStorage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(CURRENT_CONVERSATION_KEY);
                }
                
                // Si hay otras conversaciones, seleccionar la más reciente
                if (conversations.value.length > 0) {
                    const sorted = [...conversations.value].sort((a, b) => 
                        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
                    
                    console.log('[Chat] Auto-selecting most recent conversation after delete:', sorted[0].id);
                    selectConversation(sorted[0].id);
                }
            }
            
            // Actualizar caché local
            saveConversationsToCache();

            return true;
        }

        return false;
    }
    
    /**
     * Actualizar el título de una conversación
     * @param id ID de la conversación
     * @param title Nuevo título
     */
    async function updateConversationTitle(id: number, title: string) {
        // En una implementación real, aquí se llamaría a una API
        // Por ahora solo actualizamos el título localmente
        
        // Buscar la conversación en el array de conversaciones
        const conversation = conversations.value.find(c => c.id === id);
        if (conversation) {
            conversation.title = title;
            conversation.lastUpdated = new Date().toISOString();
            
            // Actualizar caché local
            saveConversationsToCache();
            
            return true;
        }
        
        return false;
    }

    /**
     * Verificar el estado de un mensaje en procesamiento
     * @param messageId ID del mensaje a verificar
     */
    async function checkMessageStatus(messageId: string) {
        try {
            console.log(`[Chat] Verificando estado del mensaje ${messageId}...`);
            const { checkMessageStatus: apiCheckStatus } = useApiService();
            const response = await apiCheckStatus(messageId);
            
            if (!response) {
                console.error(`[Chat] Error obteniendo estado del mensaje ${messageId}`);
                return null;
            }
            
            console.log(`[Chat] Estado del mensaje ${messageId}:`, response);
            
            // Si el mensaje ya está completado, actualizar la conversación actual con los datos del servidor
            if (response && response.status === 'completed' && currentConversation.value) {
                console.log(`[Chat] Mensaje ${messageId} completado. Actualizando conversación...`);
                
                // PRINCIPIO FUNDAMENTAL: "Array messages del Servidor = ¡LA ÚNICA VERDAD!"
                // Cuando el servidor nos devuelve un array de mensajes, debemos reemplazar completamente
                // nuestra lista local con este array para mantener la coherencia
                if (response.messages && Array.isArray(response.messages) && response.messages.length > 0) {
                    console.log(`[Chat] Recibido array de mensajes completo del servidor con ${response.messages.length} mensajes. Reemplazando lista local.`);
                    
                    // Guardar una referencia al ID de conversación actual
                    const currentId = currentConversation.value.id;
                    
                    // 🕒 DEBUGGING CRÍTICO: Análisis del orden de mensajes del servidor
                    console.log(`[Chat] 🎯 SERVIDOR DEVOLVIÓ ${response.messages.length} MENSAJES EN ESTE ORDEN (ASYNC):`);
                    response.messages.forEach((msg, idx) => {
                        const timestamp = msg.created_at || msg._timestamp || 'Sin timestamp';
                        console.log(`[Chat] ${idx+1}. Role=${msg.role}, ID=${msg.id}, Timestamp=${timestamp}, Content="${msg.content?.substring(0, 50)}..."`);
                    });
                    console.log(`[Chat] 🎯 FIN DEL ORDEN DEL SERVIDOR`);
                    
                    // 🔍 DEBUGGING: Ver si los IDs vienen del backend
                    console.log(`[Chat] 🆔 ANÁLISIS DE IDs EN RESPUESTA ASYNC:`);
                    response.messages.forEach((msg, idx) => {
                        console.log(`[Chat] ${idx+1}. ID del backend: ${msg.id} (tipo: ${typeof msg.id})`);
                    });
                    
                    // 🧹 LIMPIAR: Remover cualquier mensaje temporal antes de reemplazar (ASYNC)
                    console.log(`[Chat] 🧹 Limpiando mensajes temporales antes del reemplazo (ASYNC)`);
                    console.log(`[Chat] Mensajes antes de limpiar: ${currentConversation.value.messages.length}`);
                    
                    // 🗑️ CRÍTICO: Eliminar TODOS los mensajes temporales/locales antes del reemplazo (ASYNC)
                    const tempMessagesBefore = currentConversation.value.messages.filter(m => m._temp_id || m._local_status === 'sending');
                    if (tempMessagesBefore.length > 0) {
                        console.log(`[Chat] 🗑️ Eliminando ${tempMessagesBefore.length} mensajes temporales (ASYNC):`, tempMessagesBefore.map(m => ({ id: m.id, role: m.role, temp_id: m._temp_id })));
                    }
                    
                    // ✅ PRESERVAR IDs EXISTENTES: El backend a veces no envía IDs en responses async
                    const existingMessages = currentConversation.value.messages;
                    console.log(`[Chat] 🔧 PRESERVANDO IDs: ${existingMessages.length} mensajes existentes`);
                    
                    const messagesWithConversationId = response.messages.map((msg, index) => {
                        // 🔧 FIX: Preservar ID existente si el backend no lo envía
                        const existingMsg = existingMessages[index];
                        const preservedId = msg.id || existingMsg?.id || (index + 1);
                        
                        console.log(`[Chat] Mensaje ${index+1}: Backend ID=${msg.id}, Existente ID=${existingMsg?.id}, Preservado=${preservedId}`);
                        
                        const messageWithId = addConversationIdToMessage({
                            ...msg,
                            id: preservedId // ✅ Asegurar que siempre hay ID
                        }, currentConversation.value!.id);
                        
                        return {
                            ...messageWithId,
                            // Añadir timestamp local si no existe
                            _timestamp: msg._timestamp || msg.created_at || existingMsg?._timestamp || new Date().toISOString()
                        };
                    });
                    
                    // 🔧 WORKAROUND: Si el backend devuelve en orden incorrecto, intentar reordenar
                    // Detectar si el orden está mal (primer mensaje es assistant en lugar de user)
                    if (messagesWithConversationId.length >= 2 && 
                        messagesWithConversationId[0].role === 'assistant' && 
                        messagesWithConversationId[1].role === 'user') {
                        
                        console.log(`[Chat] 🔧 DETECTADO ORDEN INCORRECTO - aplicando workaround`);
                        
                        // Re-emparejar messages manteniendo el patrón user→assistant
                        const reorderedMessages = [];
                        const userMessages = messagesWithConversationId.filter(m => m.role === 'user');
                        const assistantMessages = messagesWithConversationId.filter(m => m.role === 'assistant');
                        
                        for (let i = 0; i < Math.max(userMessages.length, assistantMessages.length); i++) {
                            if (userMessages[i]) reorderedMessages.push(userMessages[i]);
                            if (assistantMessages[i]) reorderedMessages.push(assistantMessages[i]);
                        }
                        
                        console.log(`[Chat] 🔧 REORDENADO: ${reorderedMessages.length} mensajes en patrón user→assistant`);
                        messagesWithConversationId.splice(0, messagesWithConversationId.length, ...reorderedMessages);
                    }
                    
                    // 🔄 ESTRATEGIA RADICAL: Recrear completamente la conversación para forzar reactividad (ASYNC)
                    const updatedConversation = {
                        ...currentConversation.value,
                        messages: [...messagesWithConversationId], // Nuevo array
                        lastUpdated: new Date().toISOString()
                    };
                    
                    // 🔄 REEMPLAZAR la conversación completa en el array de conversaciones (ASYNC)
                    const convIndex = conversations.value.findIndex(c => c.id === currentConversation.value.id);
                    if (convIndex !== -1) {
                        // 🔄 FORZAR REACTIVIDAD: Recrear el array completo de conversaciones (ASYNC)
                        const newConversations = [...conversations.value];
                        newConversations[convIndex] = updatedConversation;
                        conversations.value = newConversations;
                    }
                    
                    // 🔄 ACTIVAR TRIGGER para forzar re-evaluación del computed (ASYNC)
                    messagesUpdateTrigger.value++;
                    
                    // 🔄 ESPERAR A QUE VUE PROCESE LOS CAMBIOS (ASYNC)
                    await nextTick();
                    
                    // 🔄 SEGUNDO NEXTICK: Doble asegurar la reactividad (ASYNC)
                    await nextTick();
                    
                    // 🔍 VERIFICACIÓN INMEDIATA: Confirmar que el orden se preservó después del reemplazo (ASYNC)
                    console.log(`[Chat] 🔍 VERIFICANDO ORDEN DESPUÉS DEL REEMPLAZO (ASYNC):`);
                    currentConversation.value.messages.forEach((msg, idx) => {
                        const timestamp = msg.created_at || msg._timestamp || 'Sin timestamp';
                        console.log(`[Chat] ${idx+1}. Role=${msg.role}, ID=${msg.id}, Timestamp=${timestamp}, Content="${msg.content?.substring(0, 50)}..."`);
                    });
                    console.log(`[Chat] 🔍 FIN DE VERIFICACIÓN POST-REEMPLAZO (ASYNC)`);
                    
                    // Actualizar metadatos adicionales
                    currentConversation.value.lastUpdated = new Date().toISOString();
                    
                    // Guardar en caché local para asegurar persistencia
                    saveConversationsToCache();
                    
                    console.log(`[Chat] Mensajes de la conversación ${currentId} actualizados desde el servidor.`);
                    
                    // 🔄 FORZAR ACTUALIZACIÓN FINAL DE LA UI (ASYNC)
                    await forceMessagesUpdate();
                    
                    // 🚨 ALERTA: Las conversaciones largas se manejan en ChatMessages.vue
                    
                    return {
                        id: messageId,
                        status: 'completed',
                        message: currentConversation.value.messages.find(m => m.role === 'assistant' && 
                            (m.message_id === messageId || m.id === messageId || m.id === response.message_id))
                    };
                } 
                // Si no recibimos el array completo, procesar la respuesta tradicional
                else {
                    console.log(`[Chat] No se recibió array de mensajes completo. Procesando respuesta individual.`);
                    
                    // Si tenemos un mensaje estructurado
                    let content = 'No se recibió respuesta del servidor';
                    
                    // Usar campos individuales en orden de prioridad
                    content = response.message || response.assistant_message || response.response || content;
                    
                    // Verificar si ya existe un mensaje del asistente con este ID
                    const existingMessageIndex = currentConversation.value.messages.findIndex(
                        m => m.role === 'assistant' && (m.message_id === messageId || m.id === messageId)
                    );
                    
                    // Si ya existe, actualizarlo en lugar de añadir uno nuevo
                    if (existingMessageIndex !== -1) {
                        console.log(`[Chat] Actualizando mensaje existente del asistente con ID ${messageId}`);
                        
                        // Actualizar mensaje existente
                        currentConversation.value.messages[existingMessageIndex] = {
                            ...currentConversation.value.messages[existingMessageIndex],
                            content: content,
                            context_data: response.context_data || response.search_results || response.sources || 
                                        currentConversation.value.messages[existingMessageIndex].context_data,
                            _local_status: 'received',
                            _timestamp: new Date().toISOString()
                        };
                    } else {
                        // ✅ INSTRUCCIÓN 1: Crear un nuevo mensaje del asistente con conversation_id
                        const assistantMessage: ChatMessage = addConversationIdToMessage({
                            id: messageId,
                            role: 'assistant',
                            content: content,
                            context_data: response.context_data || response.search_results || response.sources || null,
                            message_id: messageId,
                            created_at: response.created_at || new Date().toISOString(),
                            _local_status: 'received',
                            _timestamp: new Date().toISOString()
                        }, currentConversation.value.id);
                        
                        currentConversation.value.messages.push(assistantMessage);
                    }
                    
                    // Actualizar la fecha de última modificación
                    currentConversation.value.lastUpdated = new Date().toISOString();
                    
                    // Guardar en caché local para asegurar persistencia
                    saveConversationsToCache();
                    
                    return {
                        id: messageId,
                        status: 'completed',
                        message: currentConversation.value.messages.find(
                            m => m.role === 'assistant' && (m.message_id === messageId || m.id === messageId)
                        )
                    };
                }
            } else if (response && response.status === 'error' && currentConversation.value) {
                // En caso de error en el procesamiento del mensaje
                console.warn(`[Chat] Error en procesamiento del mensaje ${messageId}:`, response.error || 'Unknown error');
                
                // Buscar el último mensaje del usuario (presumiblemente el que causó este error)
                const userMessages = currentConversation.value.messages.filter(m => m.role === 'user');
                if (userMessages.length > 0) {
                    const lastUserMessage = userMessages[userMessages.length - 1];
                    
                    // Marcar como error para que la UI pueda mostrar un indicador
                    lastUserMessage._local_status = 'error';
                    
                    // Guardar en caché
                    saveConversationsToCache();
                }
                
                return response;
            }
            
            return response;
        } catch (err) {
            console.error(`[Chat] Error verificando estado del mensaje ${messageId}:`, err);
            return null;
        }
    }

    return {
        // Estado
        conversations,
        currentConversationId,
        isLoading,
        isTyping,
        error,

        // Getters
        currentConversation,
        currentMessages,
        messagesUpdateTrigger, // Para debugging y forzar reactividad

        // Acciones
        loadConversations,
        selectConversation,
        startNewConversation,
        sendChatMessage,
        removeConversation,
        addUserMessage,
        addAssistantMessage,
        setTyping,
        checkMessageStatus,
        updateConversationTitle,
        
        // Funciones para manejo de mensajes temporales
        addTempMessage,
        replaceTempMessage,
        markMessageFailed,
        
        // ✅ INSTRUCCIONES 2, 3, 5, 7: Nuevas funciones para filtrado y control
        getMessagesForConversation,
        clearDisplayedMessages,
        setCurrentConversationId,
        forceMessagesUpdate, // 🔄 Para forzar actualización completa
        addConversationIdToMessage,
        
        // Caché local para garantizar persistencia
        saveConversationsToCache,
        loadConversationsFromCache,
        
        // ✅ FUNCIÓN DE TEST PARA VERIFICAR PERSISTENCIA DE conversation_id
        testConversationPersistence() {
            console.log('=== TEST DE PERSISTENCIA DE CONVERSATION_ID ===');
            console.log(`currentConversationId.value: ${currentConversationId.value}`);
            console.log(`currentConversation.value?.id: ${currentConversation.value?.id}`);
            console.log(`Total conversaciones: ${conversations.value.length}`);
            
            if (currentConversation.value) {
                console.log(`Conversación actual:`, {
                    id: currentConversation.value.id,
                    title: currentConversation.value.title,
                    service: currentConversation.value.service,
                    messageCount: currentConversation.value.messages.length,
                    ragConfig: currentConversation.value.ragConfig
                });
                
                console.log(`Últimos 3 mensajes:`);
                currentConversation.value.messages.slice(-3).forEach((msg, idx) => {
                    console.log(`  ${idx + 1}. Role: ${msg.role}, Content: "${msg.content?.substring(0, 50)}..."`);
                });
            }
            
            const storedId = localStorage.getItem('chatCurrentConversationId');
            console.log(`localStorage conversation_id: ${storedId}`);
            console.log('============================================');
        },
        
        // ✅ FUNCIÓN DE TEST PARA VERIFICAR CONFIGURACIÓN RAG
        testRagConfiguration() {
            console.log('=== TEST DE CONFIGURACIÓN RAG ===');
            
            if (currentConversation.value) {
                const ragConfig = currentConversation.value.ragConfig;
                console.log(`Conversación ID: ${currentConversation.value.id}`);
                console.log(`RAG Config:`, ragConfig);
                console.log(`use_rag: ${ragConfig?.use_rag}`);
                console.log(`endpoint: ${ragConfig?.endpoint}`);
                console.log(`service_backend: ${ragConfig?.service_backend}`);
                
                if (ragConfig?.use_rag) {
                    console.log('✅ Esta conversación USARÁ RAG (/api/llm-expert/)');
                } else {
                    console.log('❌ Esta conversación NO USARÁ RAG (/api/chat/)');
                }
            } else {
                console.log('No hay conversación activa');
            }
            console.log('=====================================');
        }
    };
});