import { ref } from 'vue';

// Tipos básicos
export interface ChatMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
}

export interface Conversation {
    id: number;
    title: string;
    service: string;
    messages: ChatMessage[];
    lastUpdated: string;
}

/**
 * Composable para manejar todas las llamadas a la API de Django
 */
export function useApiService() {
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const apiUrl = '/api'; // Base URL para la API de Django

    /**
     * Obtener todas las conversaciones del usuario
     */
    async function getConversations() {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await fetch(`${apiUrl}/conversations`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.conversations || [];
        } catch (err) {
            console.error('Error obteniendo conversaciones:', err);
            error.value = 'No se pudieron cargar las conversaciones';
            return [];
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Crear una nueva conversación
     */
    async function createConversation(service: string) {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await fetch(`${apiUrl}/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ service }),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.conversation;
        } catch (err) {
            console.error('Error creando conversación:', err);
            error.value = 'No se pudo crear la conversación';
            return null;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Enviar un mensaje y obtener respuesta
     */
    async function sendMessage(conversationId: number, message: string, service: string) {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    message,
                    service
                }),
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            console.error('Error enviando mensaje:', err);
            error.value = 'No se pudo enviar el mensaje';
            return null;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Eliminar una conversación
     */
    async function deleteConversation(conversationId: number) {
        isLoading.value = true;
        error.value = null;

        try {
            const response = await fetch(`${apiUrl}/conversations/${conversationId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return true;
        } catch (err) {
            console.error('Error eliminando conversación:', err);
            error.value = 'No se pudo eliminar la conversación';
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        isLoading,
        error,
        getConversations,
        createConversation,
        sendMessage,
        deleteConversation
    };
}