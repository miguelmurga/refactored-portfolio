# MongoDB RAG System API Documentation

Este documento describe las APIs disponibles para interactuar con el sistema RAG (Retrieval-Augmented Generation) basado en MongoDB.

## Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Endpoints](#endpoints)
   - [Búsqueda Semántica](#búsqueda-semántica)
   - [Conversación RAG](#conversación-rag)
   - [Estado del Sistema](#estado-del-sistema)
   - [Administración](#administración)
3. [Modelos de Datos](#modelos-de-datos)
4. [Códigos de Error](#códigos-de-error)
5. [Limitaciones](#limitaciones)

## Autenticación

Todas las APIs requieren autenticación mediante un token de sesión. Este token debe enviarse en el encabezado HTTP `User-Session-ID`.

Para obtener un token de sesión, utilice el endpoint `/api/create-session/`.

```bash
curl -X POST https://your-api-url/api/create-session/ \
  -H "Content-Type: application/json" \
  -d '{"userId": "usuario_test", "language": "es"}'
```

## Endpoints

### Búsqueda Semántica

**Endpoint:** `/api/semantic-search/`  
**Método:** `POST`  
**Descripción:** Realiza una búsqueda semántica en documentos utilizando embeddings vectoriales.

#### Parámetros de Solicitud

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| query | string | Sí | Consulta de búsqueda |
| domain | string | No | Dominio para filtrar resultados (default: "todos") |
| similarity_metric | string | No | Métrica de similitud (default: "cosine") |
| use_mmr | boolean | No | Usar Maximum Marginal Relevance (default: true) |
| use_rerank | boolean | No | Usar reranking con Cohere (default: true) |
| language | string | No | Idioma de la consulta (default: "es") |
| min_score | number | No | Puntuación mínima de similitud (default: 0.30) |
| min_rerank_score | number | No | Puntuación mínima de reranking (default: 0.35) |
| top_k | number | No | Número máximo de resultados (default: 5) |

#### Ejemplo de Solicitud

```json
{
  "query": "¿Cómo funcionan los embeddings en IA?",
  "domain": "ia_generativa",
  "language": "es",
  "use_rerank": true,
  "top_k": 3
}
```

#### Ejemplo de Respuesta

```json
{
  "message_id": "msg_search_1685987654321",
  "query": "¿Cómo funcionan los embeddings en IA?",
  "domain": "ia_generativa",
  "results": [
    {
      "text": "Los embeddings son representaciones vectoriales de texto que capturan significado semántico. Permiten que los modelos comprendan similitudes conceptuales entre palabras, frases o documentos...",
      "score": 0.87,
      "rerank_score": 0.91,
      "source": "embeddings_semanticos.pdf",
      "domain": "ia_generativa",
      "language": "es"
    },
    {
      "text": "RAG (Retrieval-Augmented Generation) es una arquitectura que combina la recuperación de información con modelos generativos...",
      "score": 0.76,
      "rerank_score": 0.82,
      "source": "sistemas_rag.pdf",
      "domain": "ia_generativa",
      "language": "es"
    }
  ],
  "processing_time": 0.758,
  "total_results": 2,
  "metrics": {
    "similarity_metric": "cosine",
    "use_mmr": true,
    "use_rerank": true,
    "min_score": 0.3,
    "min_rerank_score": 0.35
  },
  "status": "success",
  "timestamp": "2023-06-05T12:34:56.789Z"
}
```

### Conversación RAG

**Endpoint:** `/api/rag-conversation/`  
**Método:** `POST`  
**Descripción:** Procesa un mensaje del usuario y genera una respuesta basada en documentos relevantes.

#### Parámetros de Solicitud

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| message | string | Sí | Mensaje del usuario |
| conversation_id | number/string | Sí | ID de conversación |
| user_id | string | Sí | ID de usuario |
| language | string | No | Idioma de la conversación (default: "es") |
| domain | string | No | Dominio específico (default: auto-clasificado) |

#### Ejemplo de Solicitud

```json
{
  "message": "Explícame qué es RAG y cómo funciona",
  "conversation_id": 12345,
  "user_id": "usuario_123",
  "language": "es"
}
```

#### Ejemplo de Respuesta

```json
{
  "message_id": "msg_rag_1685987654321",
  "conversation_id": 12345,
  "user_id": "usuario_123",
  "assistant_message": "Basándome en la información disponible sobre tu pregunta \"Explícame qué es RAG y cómo funciona\", he encontrado documentos relevantes que pueden ayudarte a comprender mejor el tema. La información proviene de fuentes especializadas en Inteligencia Artificial Generativa.",
  "context_data": [
    {
      "text": "RAG (Retrieval-Augmented Generation) es una arquitectura que combina la recuperación de información con modelos generativos. Primero recupera documentos relevantes de una base de conocimiento, luego los usa como contexto para generar respuestas más precisas y fundamentadas...",
      "score": 0.92,
      "rerank_score": 0.95,
      "source": "sistemas_rag.pdf",
      "domain": "ia_generativa",
      "language": "es"
    }
  ],
  "status": "success",
  "processing_time": 1.2,
  "sources_used": 1,
  "domain": "ia_generativa",
  "timestamp": "2023-06-05T12:34:56.789Z"
}
```

### Estado del Sistema

**Endpoint:** `/api/system-status/`  
**Método:** `GET`  
**Descripción:** Retorna el estado actual del sistema y verifica la validez del token de sesión.

#### Parámetros de Solicitud

Ninguno. El token de sesión debe enviarse en el encabezado HTTP `User-Session-ID`.

#### Ejemplo de Respuesta

```json
{
  "status": "ok",
  "version": "1.0",
  "timestamp": "2023-06-05T12:34:56.789Z",
  "components": {
    "api": true,
    "db": true,
    "rag": true,
    "services": true,
    "db_details": {
      "documents": 16,
      "domains": ["ia_generativa", "hacking_etico"],
      "embedding_model": "jina-embeddings-v3",
      "reranking_model": "rerank-multilingual-v3.0"
    }
  },
  "session": {
    "valid": true,
    "token": "f8a7d3e5...",
    "error": null,
    "userId": "usuario_test"
  }
}
```

### Administración

**Endpoint:** `/api/admin/load-sample-data`  
**Método:** `POST`  
**Descripción:** Carga datos de muestra en el sistema RAG.

> ⚠️ Este endpoint requiere autenticación como administrador mediante el encabezado `Admin-API-Key`.

#### Parámetros de Solicitud

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| force | boolean | No | Sobrescribir datos existentes (default: false) |

#### Ejemplo de Solicitud

```json
{
  "force": true
}
```

#### Ejemplo de Respuesta

```json
{
  "status": "success",
  "message": "Sample data loaded successfully",
  "execution_time": "5.23s",
  "timestamp": "2023-06-05T12:34:56.789Z"
}
```

## Modelos de Datos

### Documento RAG

```typescript
interface RagDocument {
  _id?: string;
  text: string;
  source: string;
  domain: string;
  language: string;
  embedding?: number[];
  metadata?: any;
}
```

### Resultado de Búsqueda

```typescript
interface SearchResult {
  text: string;
  score: number;
  rerank_score?: number | null;
  source: string;
  domain: string;
  language?: string;
  metadata?: any;
}
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Solicitud inválida |
| 401 | Autenticación requerida |
| 403 | Acceso prohibido |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

## Limitaciones

- La autenticación utiliza un esquema simplificado basado en tokens, no JWT completo
- El sistema de búsqueda vectorial implementa una búsqueda en memoria para compatibilidad
- Las llaves API de Jina AI y Cohere tienen límites de uso mensual
- El sistema está optimizado para textos en español, inglés y portugués

---

Para consultas adicionales o soporte, contactar al equipo de desarrollo.