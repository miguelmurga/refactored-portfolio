# 🔧 Guía de Configuración de Backend mediante Variable de Entorno

## Descripción
Este sistema permite configurar dinámicamente la URL del backend modificando únicamente la variable de entorno en el archivo `.env`, sin necesidad de cambiar código.

## Variable de Entorno

### 📄 Archivo `.env`
```bash
# Backend API URL completa
NUXT_API_URL=http://127.0.0.1:8000/api
```

## Cómo Funciona

### 🚀 Sistema Modular Dinámico
El sistema construye automáticamente las URLs finales combinando:
- `NUXT_API_URL` (URL base) + endpoints fijos (`/ai-expert/`, `/security-expert/`, `/unified-agent/`)

### 🎯 Ejemplos de URLs Construidas
```
IA Generativa: http://127.0.0.1:8000/api/ai-expert/
Ciberseguridad: http://127.0.0.1:8000/api/security-expert/  
Agente Unificado: http://127.0.0.1:8000/api/unified-agent/
```

## Cambiar Backend

### 1️⃣ Para Desarrollo Local
```bash
# En .env
NUXT_API_URL=http://127.0.0.1:8000/api
```

### 2️⃣ Para Producción

```bash
# En .env
NUXT_API_URL=https://tu-backend-produccion.com/api
```

### 3️⃣ Para Testing/Staging
```bash
# En .env
NUXT_API_URL=https://staging-backend.com/api
```

## Reiniciar para Aplicar Cambios

⚠️ **Importante**: Después de modificar el archivo `.env`, reinicia el servidor de desarrollo:

```bash
# Parar el servidor
Ctrl + C

# Reiniciar
npm run dev
```

## Verificar Configuración

### 🔍 En Consola del Navegador
Al enviar mensajes, verás logs como:
```
[API] 🤖 AGENTE ESPECIALIZADO: IA Generativa (RAG ON) → http://127.0.0.1:8000/api/ai-expert/
```

### 🧪 Prueba de Configuración
1. Cambia la URL en `.env`
2. Reinicia el servidor (`npm run dev`)
3. Envía un mensaje en el chat
4. Verifica en consola que use la nueva URL base

## Estructura de Archivos Modificados

### ✅ Archivos Actualizados
- `.env` - Variable de configuración
- `.env.example` - Plantilla de ejemplo  
- `nuxt.config.ts` - Configuración de runtime
- `composables/useApiService.ts` - Lógica de endpoints

### 🔄 Flujo de Configuración
```
.env → nuxt.config.ts → useApiService.ts → URLs finales
```

## Casos de Uso

### 🏢 Producción
```bash
NUXT_API_URL=https://prod-api.empresa.com/api
```

### 🧪 Testing/Staging  
```bash
NUXT_API_URL=https://staging-api.empresa.com/api
```

### 🏠 Desarrollo Local
```bash
NUXT_API_URL=http://127.0.0.1:8000/api
```

---

## ✨ Beneficios

✅ **Sin Cambios de Código**: Solo modificar `.env`  
✅ **Configuración Simple**: Una sola variable  
✅ **Múltiples Entornos**: Dev, staging, producción  
✅ **Compatibilidad**: Sistema modular mantiene funcionalidad  
✅ **Rollback Fácil**: Cambiar `.env` y reiniciar