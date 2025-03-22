// composables/useSession.ts
import { useSessionStore } from '~/stores/session'

export const useSession = () => {
    const sessionStore = useSessionStore()
    return sessionStore
}
