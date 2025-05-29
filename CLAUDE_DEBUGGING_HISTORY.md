# Historia de Debugging - Chat Application

## Resumen Ejecutivo
Este documento contiene el historial completo de problemas identificados y soluciones implementadas en la aplicación de chat Nuxt.js con múltiples agentes de IA.

## Problema Principal: Ordenamiento de Mensajes y Routing de Agentes

### 🔴 Estado Actual (NO RESUELTO)
- **Problema 1**: Los mensajes NO aparecen en orden cronológico correcto
- **Problema 2**: El selector de agente NO funciona correctamente
  - Ejemplo: Usuario selecciona "Gen AI" pero la petición va a `/api/security-expert/`
  - Log evidencia: `POST /api/security-expert/ HTTP/1.1 202 202`

---

## Investigación Realizada

### 1. Análisis del Problema de Ordenamiento

**Causa Raíz Identificada**: Doble ordenamiento conflictivo
- **Store** (`chatStore.ts`): Ordenaba mensajes una vez
- **Componente página** (`[id].vue`): Re-ordenaba con lógica diferente

**Backend envía orden correcto**:
```json
"messages": [
    {"id": 1, "role": "user", "content": "..."},
    {"id": 2, "role": "assistant", "content": "..."},
    {"id": 3, "role": "user", "content": "..."}
]
```

### 2. Soluciones Implementadas (PARCIALES)

#### Store (chatStore.ts)
```typescript
// Línea ~347: Lógica condicional de ordenamiento
const hasTemporaryMessages = messages.some(msg => msg._temp_id || msg._local_status === 'sending');

if (hasTemporaryMessages) {
    // Aplicar sorting complejo
    const sortedMessages = [...messages].sort((a, b) => { /* lógica compleja */ });
    return sortedMessages;
} else {
    // Preservar orden exacto del backend
    return messages;
}
```

#### Página ([id].vue)
```typescript
// Línea ~1118: Eliminado reordenamiento complejo
const currentMessages = computed(() => {
    const messages = chatStore.currentMessages;
    return messages; // No re-ordenar - confiar en el store
});
```

#### Límite de Mensajes
- **Implementado**: Límite de 20 mensajes por conversación
- **Ubicación**: `sendMessage()` función en página
- **Características**:
  - Bloquea envío a partir del mensaje 20
  - Indicador visual (contador X/20)
  - Input field deshabilitado y coloreado en rojo

#### Sistema de Alertas Persistentes
- **Implementado**: Alerta aparece cada vez en conversaciones >4 mensajes
- **Componente**: `LongConversationNotice.vue`
- **Comportamiento**: Sin persistencia localStorage (siempre se muestra)

---

## Problemas NO Resueltos

### 1. 🔴 Ordenamiento de Mensajes CRÍTICO
**Status**: FALLA - Los mensajes siguen apareciendo desordenados
**Evidencia**: Usuario reporta que sigue necesitando refresh para ver orden correcto

**Posibles causas restantes**:
- Problemas de reactividad de Vue
- Race conditions en actualización de store
- Conflictos entre cache local y datos del backend
- Timing issues en `messagesUpdateTrigger`

### 2. 🔴 Routing de Agentes CRÍTICO
**Status**: FALLA - Selector no controla endpoint correcto
**Evidencia**: 
```
Usuario selecciona: "Gen AI"
Request real: POST /api/security-expert/
Request esperado: POST /api/llm-expert/
```

**Ubicación del problema**: 
- `useApiService.ts` función `sendMessage()` (línea ~714-731)
- Lógica de selección de endpoint basada en `domain` y `service`

---

## Archivos Modificados

### Principales
1. **stores/chatStore.ts**
   - Función `sortMessagesByTimestampAndId()` (línea ~98)
   - Computed `currentMessages` (línea ~347)
   - Múltiples funciones con reordenamiento forzado

2. **pages/chat/[id].vue** 
   - Computed `currentMessages` simplificado (línea ~1118)
   - Límite de 20 mensajes en `sendMessage()` (línea ~1411)
   - Computed `hasReachedMessageLimit` (línea ~1210)

3. **components/global/LongConversationNotice.vue**
   - Sistema de alertas persistentes (creado completo)

4. **composables/useApiService.ts**
   - Función `replaceTempMessage()` mejorada (línea ~189)

---

## Próximos Pasos Requeridos

### 1. Investigar Routing de Agentes
**Ubicación**: `useApiService.ts` líneas 714-731
```typescript
if (useRag && domain === 'ia_generativa') {
    endpoint = `${apiUrl}/llm-expert/`;      // ✅ Correcto
} else if (useRag && domain === 'ciberseguridad') {
    endpoint = `${apiUrl}/security-expert/`; // ✅ Correcto
} else {
    endpoint = `${apiUrl}/chat/`;            // ✅ Correcto
}
```

**Verificar**:
- ¿Qué valor tiene `domain` cuando usuario selecciona "Gen AI"?
- ¿Está llegando `useRag` correctamente?
- ¿Hay override en alguna parte del código?

### 2. Debug Ordenamiento Real
**Estrategia**: Agregar logging exhaustivo para identificar dónde se pierde el orden
```typescript
// En cada punto crítico, loggear:
console.log('ORDEN EN PUNTO X:', messages.map(m => `${m.id}:${m.role}`));
```

**Puntos críticos**:
- `loadConversations()` después de recibir del backend
- `currentMessages` computed en store
- `currentMessages` computed en página
- Renderizado final en template

### 3. Verificar Reactividad
**Posible problema**: `messagesUpdateTrigger` no está causando re-render correcto
**Solución**: Investigar si Vue está detectando cambios en arrays anidados

---

## Configuración del Sistema

### Agentes Disponibles
1. **Gen AI**: `/api/llm-expert/` (domain: 'ia_generativa')
2. **Security Expert**: `/api/security-expert/` (domain: 'ciberseguridad') 
3. **Chat General**: `/api/chat/` (sin domain específico)

### Límites Implementados
- **4 mensajes**: Alerta de conversación larga (persistente)
- **20 mensajes**: Bloqueo completo de envío

---

## Estado del Código

### ✅ Funcional
- Sistema de alertas persistentes
- Límite de 20 mensajes
- Manejo de IDs undefined
- Debugging extensivo

### 🔴 No Funcional
- **Ordenamiento cronológico** - CRÍTICO
- **Routing de agentes** - CRÍTICO
- Reactividad en tiempo real

### 🟡 Necesita Verificación
- Performance con muchos mensajes
- Comportamiento en edge cases
- Cache consistency

---

*Documento generado el 27/May/2025 para Claude Code debugging*