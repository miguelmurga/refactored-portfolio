# Portfolio con Chat AI basado en MongoDB

Este proyecto es un portafolio profesional con funcionalidades de chat AI avanzadas. La aplicación está construida con Nuxt 3 y se integra con un backend de Django que utiliza MongoDB para almacenar embeddings vectoriales.

## Características Principales

- **Interfaz de Chat AI**: Sistema de chat con diferentes servicios de IA
- **Embeddings MongoDB**: Búsqueda semántica con embeddings vectoriales
- **Multilingüe**: Soporte completo para español, inglés y portugués
- **RAG (Retrieval-Augmented Generation)**: Mejora las respuestas con contexto de documentos
- **Integración con MongoDB**: Almacenamiento eficiente de vectores para búsqueda semántica

## Servicios de IA Disponibles

1. **Experto en Ciberseguridad**: Asesoramiento especializado en temas de seguridad informática
2. **Experto en IA Generativa**: Información sobre modelos de lenguaje y tecnologías de IA
3. **Consulta RAG con MongoDB**: Sistema que combina búsqueda semántica y generación de texto

## Setup

Asegúrate de instalar las dependencias:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Configuración del Backend

Esta aplicación frontend se conecta a un backend Django con MongoDB. Asegúrate de que el backend esté configurado correctamente:

1. Clona el repositorio del backend Django
2. Configura las variables de entorno para MongoDB
3. Inicia el servicio de Django con la API REST activa
4. Verifica que los endpoints de la API estén disponibles en `http://localhost:8000/api/`

### Variables de Entorno

El proyecto utiliza un archivo `.env` para configurar la conexión con el backend:

```
# URL del backend Django
NUXT_API_URL=http://localhost:8000/api

# Secreto para JWT (solo para desarrollo)
NUXT_JWT_SECRET=tu_clave_secreta_super_segura
```

Para modificar la URL del backend, simplemente cambia el valor de `NUXT_API_URL` en el archivo `.env` y reinicia la aplicación. Esto actualizará automáticamente todas las llamadas API en la aplicación.

#### Configuración en producción

En entornos de producción, puedes configurar la URL del backend de varias formas:

1. **Variables de entorno en el servidor**: Configura directamente la variable `NUXT_API_URL` en el servidor donde se aloja la aplicación.

2. **Durante el despliegue**: Muchas plataformas de hosting como Vercel, Netlify o Azure permiten configurar variables de entorno a través de su interfaz.

3. **Contenedores Docker**: Si utilizas Docker, puedes pasar la variable como un argumento al contenedor:

```bash
docker run -e NUXT_API_URL=https://api.tudominio.com/api tu-imagen-nuxt
```

4. **Archivo .env.production**: Puedes crear un archivo `.env.production` con la configuración específica para producción.

**Importante**: La aplicación siempre utilizará la URL especificada en `NUXT_API_URL` para todas las llamadas al backend, por lo que es esencial que esta variable esté correctamente configurada.

## API Endpoints Requeridos

El frontend espera los siguientes endpoints:

- `/api/create-session/`: Crear una nueva sesión de usuario
- `/api/conversations/`: Gestionar conversaciones
- `/api/chat/`: Endpoint principal para el chat con IA generativa
- `/api/security-expert/`: Servicio de chatbot especializado en ciberseguridad
- `/api/rag-conversation/`: Servicio RAG con embeddings MongoDB
- `/api/semantic-search/`: Búsqueda semántica directa en la base de conocimiento
- `/api/message-status/:id`: Verificar estado de mensajes procesados asincrónicamente
- `/api/upload-document`: Subir documentos a la base de conocimiento

## Páginas Disponibles

- `/`: Página principal del portafolio
- `/ai-chat`: Interfaz de chat original
- `/mongodb-ai-chat`: Nueva interfaz de chat con MongoDB y embeddings

## Desarrollo

Inicia el servidor de desarrollo:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## Producción

Compila la aplicación para producción:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Vista previa local de la compilación de producción:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

# bun
bun run preview
```

## Funcionalidades MongoDB Chat

La implementación del chat con MongoDB incluye:

- **Búsqueda Semántica**: Encuentra información relevante en documentos utilizando embeddings vectoriales
- **Opciones RAG Configurables**: Ajusta parámetros como métrica de similitud (coseno/euclídea), MMR y ReRank
- **Subida de Documentos**: Añade nuevos documentos a la base de conocimiento
- **Soporte Multilingüe**: Plena compatibilidad con es, en, pt
- **Procesamiento Asíncrono**: Manejo de mensajes de larga duración con polling de estado
- **Contexto Enriquecido**: Visualización de fuentes de información en las respuestas

## Tecnologías Utilizadas

- **Frontend**: Nuxt 3, Vue 3, TypeScript, Tailwind CSS
- **Backend**: Django (API REST)
- **Base de Datos**: MongoDB (almacenamiento de embeddings)
- **Embeddings**: Jina AI, Cohere ReRank
- **Modelos de IA**: DeepSeek-Coder

## Recursos Adicionales

- [Documentación de Nuxt 3](https://nuxt.com/docs/getting-started/introduction)
- [Despliegue de Nuxt](https://nuxt.com/docs/getting-started/deployment)