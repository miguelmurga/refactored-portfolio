/**
 * Cache de conversaciones con TTL para evitar peticiones duplicadas
 */

class ConversationCache {
    private cache = new Map<string, {value: any, timestamp: number}>();
    private readonly TTL = 30000; // 30 segundos

    constructor() {
        console.log('[ConversationCache] Initialized with TTL:', this.TTL);
    }

    /**
     * Guardar en cache
     */
    set(key: string, value: any): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
        
        console.log(`[ConversationCache] Cached item: ${key} (total: ${this.cache.size})`);
    }

    /**
     * Obtener del cache
     */
    get(key: string): any | null {
        const item = this.cache.get(key);
        if (!item) {
            console.log(`[ConversationCache] Cache miss: ${key}`);
            return null;
        }

        // Verificar TTL
        if (Date.now() - item.timestamp > this.TTL) {
            this.cache.delete(key);
            console.log(`[ConversationCache] Cache expired: ${key}`);
            return null;
        }

        console.log(`[ConversationCache] Cache hit: ${key}`);
        return item.value;
    }

    /**
     * Limpiar cache completo
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        console.log(`[ConversationCache] Cleared ${size} items`);
    }

    /**
     * Limpiar elementos expirados
     */
    cleanup(): void {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.TTL) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`[ConversationCache] Cleaned up ${cleaned} expired items`);
        }
    }

    /**
     * Obtener estadísticas del cache
     */
    stats(): {size: number, ttl: number} {
        return {
            size: this.cache.size,
            ttl: this.TTL
        };
    }

    /**
     * Verificar si una clave existe y no ha expirado
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }
}

// Instancia singleton
const conversationCache = new ConversationCache();

// Limpieza automática cada 5 minutos
if (typeof window !== 'undefined') {
    setInterval(() => {
        conversationCache.cleanup();
    }, 5 * 60 * 1000);
}

/**
 * Composable para usar el cache de conversaciones
 */
export function useConversationCache() {
    return conversationCache;
}

export default conversationCache;