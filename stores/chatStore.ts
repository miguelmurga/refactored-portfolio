import { defineStore } from 'pinia';
import { useApiService, Conversation, ChatMessage } from '~/composables/useApiService';

export const useChatStore = defineStore('chat', () => {
    // Estado
    const conversations = ref<Conversation[]>([]);
    const currentConversationId = ref<number | null>(null);
    const isTyping = ref(false);
    const conversationsLoaded = ref(false);

    // API service
    const { isLoading, error, getConversations, createConversation, sendMessage, deleteConversation } = useApiService();

    // Getters
    const currentConversation = computed(() => {
        if (!currentConversationId.value) return null;
        return conversations.value.find(c => c.id === currentConversationId.value) || null;
    });

    const currentMessages = computed(() => {
        return currentConversation.value?.messages || [];
    });

    // Acciones

    /**
     * Cargar todas las conversaciones desde la API
     */
    async function loadConversations() {
        if (conversationsLoaded.value) return;

        try {
            const data = await getConversations();
            conversations.value = data.map((conv: any) => ({
                ...conv,
                lastUpdated: new Date(conv.lastUpdated).toISOString()
            }));
            conversationsLoaded.value = true;
        } catch (err) {
            console.error('Error cargando conversaciones:', err);
        }
    }

    /**
     * Seleccionar una conversación
     */
    function selectConversation(id: number) {
        currentConversationId.value = id;
    }

    /**
     * Crear una nueva conversación
     */
    async function startNewConversation(service: string) {
        try {
            const newConversation = await createConversation(service);
            if (newConversation) {
                conversations.value.push({
                    ...newConversation,
                    lastUpdated: new Date(newConversation.lastUpdated).toISOString()
                });
                currentConversationId.value = newConversation.id;
                return newConversation.id;
            }
        } catch (err) {
            console.error('Error creando conversación:', err);
            return null;
        }
    }

    /**
     * Enviar un mensaje a la conversación actual
     */
    async function sendChatMessage(content: string) {
        if (!currentConversation.value) return false;

        // Añadir mensaje del usuario inmediatamente
        const userMessage: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content
        };

        // Añadir localmente
        if (currentConversation.value) {
            currentConversation.value.messages.push(userMessage);
            currentConversation.value.lastUpdated = new Date().toISOString();

            // Actualizar título si es el primer mensaje
            if (currentConversation.value.messages.length === 1) {
                currentConversation.value.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
            }
        }

        // Indicar que estamos esperando respuesta
        isTyping.value = true;

        try {
            const response = await sendMessage(
                currentConversation.value.id,
                content,
                currentConversation.value.service
            );

            if (response && response.assistant_message) {
                // Añadir la respuesta del asistente
                const assistantMessage: ChatMessage = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: response.assistant_message
                };

                // Añadir localmente
                if (currentConversation.value) {
                    currentConversation.value.messages.push(assistantMessage);
                    currentConversation.value.lastUpdated = new Date().toISOString();
                }

                return true;
            }
            return false;
        } catch (err) {
            console.error('Error enviando mensaje:', err);
            return false;
        } finally {
            isTyping.value = false;
        }
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
            }

            return true;
        }

        return false;
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

        // Acciones
        loadConversations,
        selectConversation,
        startNewConversation,
        sendChatMessage,
        removeConversation
    };
});