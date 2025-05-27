/**
 * Controlador singleton para manejo de conversaciones
 * Previene la creación de conversaciones duplicadas
 */

class ConversationController {
    private creatingConversation = false;
    private pendingCreation: Promise<any> | null = null;
    private conversationCache = new Map<string, {value: any, timestamp: number}>();
    private readonly TTL = 30000; // 30 segundos

    constructor() {
        console.log('[ConversationController] Initialized');
    }

    /**
     * Crea una conversación de manera segura evitando duplicados
     */
    async createConversation(payload: any): Promise<any> {
        const requestId = `create-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        
        // Si ya estamos creando una conversación, esperar a que termine
        if (this.creatingConversation && this.pendingCreation) {
            console.log(`[ConversationController] Creation already in progress (${requestId}), waiting...`);
            return this.pendingCreation;
        }

        this.logOperation('CREATE_CONVERSATION_START', { requestId, payload });

        this.creatingConversation = true;
        this.pendingCreation = this._doCreateConversation(payload, requestId);

        try {
            const result = await this.pendingCreation;
            this.logOperation('CREATE_CONVERSATION_SUCCESS', { requestId, conversationId: result?.id });
            return result;
        } catch (error) {
            this.logOperation('CREATE_CONVERSATION_ERROR', { requestId, error: error.message });
            throw error;
        } finally {
            this.creatingConversation = false;
            this.pendingCreation = null;
        }
    }

    /**
     * Implementación real de la creación de conversación
     */
    private async _doCreateConversation(payload: any, requestId: string): Promise<any> {
        const { useApiService } = await import('~/composables/useApiService');
        const apiService = useApiService();

        // Verificar si ya existe una conversación reciente del mismo tipo
        const { useChatStore } = await import('~/stores/chatStore');
        const store = useChatStore();
        
        const recentConversation = store.conversations
            .filter(conv => conv.service === payload.service)
            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0];

        // ✅ PREVENIR CREACIÓN DE CONVERSACIONES DUPLICADAS
        // Si hay una conversación reciente del mismo tipo (menos de 10 segundos), reutilizarla
        if (recentConversation && 
            (Date.now() - new Date(recentConversation.lastUpdated).getTime()) < 10000) {
            console.log(`[ConversationController] Using recent conversation ${recentConversation.id} instead of creating new one`);
            console.log(`[ConversationController] → service: ${recentConversation.service}`);
            console.log(`[ConversationController] → last updated: ${recentConversation.lastUpdated}`);
            return recentConversation;
        }

        // ✅ PREVENIR MÚLTIPLES CONVERSACIONES VACÍAS DEL MISMO SERVICIO
        // Si hay una conversación vacía (sin mensajes) del mismo servicio, reutilizarla
        const emptyConversation = store.conversations
            .filter(conv => 
                conv.service === payload.service && 
                (!conv.messages || conv.messages.length === 0)
            )[0];

        if (emptyConversation) {
            console.log(`[ConversationController] Found empty conversation of same service, reusing ID ${emptyConversation.id}`);
            return emptyConversation;
        }

        // Crear nueva conversación usando el API service
        const response = await apiService.createConversation(
            payload.title || `Conversación ${payload.service}`,
            payload.service,
            payload.language,
            payload
        );

        // ✅ VALIDAR QUE LA RESPUESTA TENGA UN ID NUMÉRICO VÁLIDO
        if (response && response.id) {
            const numericId = Number(response.id);
            if (isNaN(numericId) || numericId <= 0) {
                console.error(`[ConversationController] ERROR: ID de conversación inválido recibido: ${response.id}`);
                throw new Error(`ID de conversación inválido: ${response.id}`);
            }
            
            // Asegurar que el ID sea numérico en la respuesta
            response.id = numericId;
            console.log(`[ConversationController] ✅ Conversación creada con ID numérico válido: ${response.id}`);
        } else {
            console.error(`[ConversationController] ERROR: Respuesta de creación sin ID válido:`, response);
            throw new Error('La API no devolvió un ID de conversación válido');
        }

        return response;
    }

    /**
     * Cache para conversaciones con TTL
     */
    setCache(key: string, value: any): void {
        this.conversationCache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    getCache(key: string): any | null {
        const item = this.conversationCache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.TTL) {
            this.conversationCache.delete(key);
            return null;
        }

        return item.value;
    }

    clearCache(): void {
        this.conversationCache.clear();
        console.log('[ConversationController] Cache cleared');
    }

    /**
     * Logging estructurado para debugging
     */
    private logOperation(operation: string, data: any): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}][ConversationController][${operation}]`, {
            creatingConversation: this.creatingConversation,
            cacheSize: this.conversationCache.size,
            ...data
        });
    }

    /**
     * Verificar si hay una operación de creación en progreso
     */
    isCreating(): boolean {
        return this.creatingConversation;
    }

    /**
     * Crear conversación con validaciones completas
     */
    async createNewConversation(service: string, options: any = {}): Promise<any> {
        const requestId = `new-conv-${Date.now()}`;
        
        // 1. Verificar si ya existe una conversación en progreso
        if (this.creatingConversation) {
            console.log(`[ConversationController] Creation already in progress (${requestId})`);
            return null;
        }

        // 2. Preparar payload
        const payload = {
            service,
            language: options.language || 'es',
            userId: 'usuario_test',
            use_deepseek_reasoning: options.use_deepseek_reasoning || false,
            use_rag: options.use_rag !== undefined ? options.use_rag : true,
            domain: options.domain || (service === 'security_expert' ? 'ciberseguridad' : 
                   service === 'ia_generativa' || service === 'ai_expert' ? 'ia_generativa' : 'todos'),
            title: options.title || `Nueva conversación ${service}`,
            ...options
        };

        this.logOperation('CREATE_NEW_CONVERSATION_START', { requestId, service, options });

        try {
            const conversation = await this.createConversation(payload);
            this.logOperation('CREATE_NEW_CONVERSATION_SUCCESS', { 
                requestId, 
                conversationId: conversation?.id,
                service 
            });
            return conversation;
        } catch (error) {
            this.logOperation('CREATE_NEW_CONVERSATION_ERROR', { 
                requestId, 
                service, 
                error: error.message 
            });
            throw error;
        }
    }
}

// Crear instancia singleton
const conversationController = new ConversationController();

/**
 * Composable para usar el controlador de conversaciones
 */
export function useConversationController() {
    return conversationController;
}

export default conversationController;