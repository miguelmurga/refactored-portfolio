# 🚀 Deployment Guide

Este documento describe cómo desplegar la aplicación en producción.

## 📋 Pre-requisitos

- Node.js 18+ 
- npm o yarn
- Backend Django corriendo
- Variables de entorno configuradas

## 🔧 Configuración para Producción

### 1. Variables de Entorno

Crea un archivo `.env.local` basado en `.env.production`:

```bash
cp .env.production .env.local
```

Edita `.env.local` con tus valores de producción:

```env
# Backend URL de producción
NUXT_API_URL=https://tu-backend.com/api

# Modo desarrollo (false en producción)
NUXT_DEV_MODE=false

# Logs de debug (false en producción)
NUXT_DEBUG_LOGS=false

# Entorno
NODE_ENV=production
```

### 2. Build para Producción

```bash
# Build optimizado para producción
npm run build:prod

# O generar sitio estático
npm run generate:prod
```

### 3. Iniciar en Producción

```bash
# Servidor de producción
npm run start:prod
```

## 🛡️ Características de Seguridad

La aplicación incluye automáticamente en producción:

- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **CORS**: Configurado para rutas well-known
- **Compresión**: Assets comprimidos automáticamente
- **Minificación**: Código minificado
- **Cache**: Headers de cache optimizados

## 📊 Optimizaciones de Rendimiento

- ✅ **Compresión gzip** de assets estáticos
- ✅ **Minificación** de JavaScript y CSS
- ✅ **Tree shaking** automático
- ✅ **Prerender** de página principal
- ✅ **Cache** optimizado para rutas estáticas
- ✅ **Logs de debug** deshabilitados en producción

## 🔍 Troubleshooting

### Logs de Debug en Producción

Si necesitas habilitar logs para debugging:

```env
NUXT_DEBUG_LOGS=true
```

### Chrome DevTools Warnings

Los warnings de `/.well-known/appspecific/com.chrome.devtools.json` han sido resueltos con:
- Página catch-all en `pages/.well-known/[...path].vue`
- Configuración de routeRules optimizada

### Verificar Build

```bash
# Previsualizar build local
npm run preview

# Verificar que no hay logs de debug
npm run build:prod
```

## 📦 Deployment Options

### Option 1: Node.js Server

```bash
npm run build:prod
npm run start:prod
```

### Option 2: Static Generation

```bash
npm run generate:prod
# Deploy contenido de .output/public/
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:prod
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 🚨 Post-Deployment Checklist

- [ ] Backend API accesible desde frontend
- [ ] Variables de entorno configuradas correctamente
- [ ] Logs de debug deshabilitados
- [ ] Security headers funcionando
- [ ] Rutas well-known sin warnings
- [ ] Chat funcionando correctamente
- [ ] Ordenamiento de mensajes correcto
- [ ] Routing de agentes funcionando

## 📞 Soporte

Si encuentras problemas:

1. Verifica variables de entorno
2. Revisa logs del servidor
3. Confirma que backend está accesible
4. Verifica configuración de CORS en backend