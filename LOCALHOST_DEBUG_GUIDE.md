# 🔧 Guía de Debugging para Conectividad Localhost

## Problema Detectado
El navegador está cambiando automáticamente `http://localhost:8000` a `https://localhost:8000`, causando el error:
```
GET https://127.0.0.1:8000/api/conversations/ net::ERR_SSL_PROTOCOL_ERROR
```

## Posibles Causas y Soluciones

### 1. 🚨 **HSTS (HTTP Strict Transport Security)**
El navegador puede tener una regla HSTS para localhost que fuerza HTTPS.

**Solución:**
1. Abre Chrome DevTools (F12)
2. Ve a la pestaña **Security**
3. Busca "HSTS" en la configuración
4. O escribe en la barra de direcciones: `chrome://net-internals/#hsts`
5. En "Delete domain security policies" escribir: `localhost`
6. Reinicia el navegador

### 2. 🔄 **Cache del Navegador**
El navegador puede tener cacheado un redirect de HTTP a HTTPS.

**Solución:**
```bash
# Hard refresh
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# O borrar cache específico:
# DevTools > Application > Storage > Clear Site Data
```

### 3. 🌐 **Mixed Content Policy**
Si el frontend está en HTTPS, el navegador bloquea peticiones HTTP.

**Solución A - Verificar protocolo del frontend:**
```javascript
// En la consola del navegador:
console.log('Frontend protocol:', window.location.protocol);
console.log('Frontend URL:', window.location.href);
```

**Solución B - Forzar HTTP en desarrollo:**
```bash
# En nuxt.config.ts (SOLO PARA DESARROLLO)
export default defineNuxtConfig({
  devServer: {
    https: false,
    port: 3000
  }
})
```

### 4. 🔧 **Verificar Backend**
Confirmar que el backend está corriendo en HTTP (no HTTPS).

**Pruebas manuales:**
```bash
# Test 1: Ping básico
curl http://localhost:8000/api/

# Test 2: Con endpoint específico
curl http://localhost:8000/api/conversations/

# Test 3: Verificar que NO sea HTTPS
curl https://localhost:8000/api/  # Esto DEBE fallar
```

### 5. 🎯 **Cambio de Puerto**
Usar un puerto diferente puede evitar políticas cached.

```bash
# En .env
NUXT_API_URL=http://localhost:8001/api
```

### 6. 🌍 **Usar IP Externa**
Si localhost está problemático, usar la IP local de la máquina.

```bash
# Encontrar IP local:
ipconfig getifaddr en0  # Mac
hostname -I  # Linux
ipconfig  # Windows

# Ejemplo en .env:
NUXT_API_URL=http://192.168.1.100:8000/api
```

## Debugging Steps

### Paso 1: Verificar Configuración Actual
```bash
# Reiniciar servidor Nuxt
npm run dev

# Verificar logs en consola del navegador
# Buscar líneas como:
# [API] Using backend URL: http://localhost:8000/api
# [FETCH-DEBUG] About to fetch URL: http://localhost:8000/api/conversations/
```

### Paso 2: Test Manual del Backend
```bash
# Desde terminal (no navegador):
curl -v http://localhost:8000/api/conversations/

# Respuesta esperada:
# Debe conectar sin errores SSL
# Puede devolver 401 (sin token), pero NO errores de conexión
```

### Paso 3: Verificar Mixed Content
```javascript
// En consola del navegador:
console.log('Window location:', window.location.href);
console.log('Is HTTPS?:', window.location.protocol === 'https:');

// Si el frontend es HTTPS y backend HTTP = PROBLEMA
```

### Paso 4: Probar con IP Local
```bash
# En .env:
NUXT_API_URL=http://192.168.1.x:8000/api

# Reiniciar: npm run dev
```

## Configuración Recomendada para Desarrollo

### .env (Desarrollo Local)
```bash
# Opción 1: localhost (recomendado)
NUXT_API_URL=http://localhost:8000/api

# Opción 2: IP local (si localhost falla)
NUXT_API_URL=http://192.168.1.100:8000/api

# Opción 3: Puerto alternativo
NUXT_API_URL=http://localhost:8001/api
```

### Verificación de Funcionamiento
✅ El log debería mostrar:
```
[API] Using backend URL: http://localhost:8000/api
[FETCH-DEBUG] About to fetch URL: http://localhost:8000/api/conversations/
```

❌ NO debería mostrar:
```
GET https://localhost:8000/api/conversations/ net::ERR_SSL_PROTOCOL_ERROR
```

## Next Steps
1. Aplicar los cambios sugeridos
2. Reiniciar el servidor de desarrollo
3. Verificar en consola que se use HTTP (no HTTPS)
4. Si persiste, probar las alternativas listadas arriba