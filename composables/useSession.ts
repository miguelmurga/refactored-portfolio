// composables/useSession.ts
import { useSessionStore } from '~/stores/session'

export const useSession = () => {
    return useSessionStore()
}
