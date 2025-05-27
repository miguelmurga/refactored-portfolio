# Changelog

## [2023-05-22] - Mejoras en Gestión de Sesiones y Autenticación

### Mejoras de Autenticación
- Implementada autenticación completa basada en tokens JWT
- Todas las peticiones API ahora incluyen el header `User-Session-ID`
- Las conversaciones ahora están asociadas al token de sesión específico del usuario
- Endpoint `/api/check-session/` implementado para verificar validez de tokens

### Mejoras en la Experiencia de Usuario
- Mejorado el flujo de carga inicial para evitar recargas manuales
- Implementada la carga automática de conversaciones después de verificar la sesión
- Añadido auto-selección de la conversación más reciente si no hay ninguna seleccionada
- Agregado manejo de errores más robusto con reintentos automáticos para peticiones fallidas

### Mejoras Técnicas
- URL del backend ahora centralizada en un archivo `.env`
- Implementado proxy local para desarrollo que evita problemas CORS
- Mejorada la robustez del sistema con timeouts y reintentos
- Añadido manejo de sesiones inválidas con renovación automática

### Cambios en la Arquitectura
- Reorganización del código para mejor mantenibilidad
- Implementado patrón de proxy para centralizar manejo de errores
- Mejorada la gestión de sesiones en `app.vue`
- Actualizados los componentes UI para trabajar correctamente con la nueva autenticación

## [2023-05-15] - Implementación Inicial de RAG con MongoDB

### Funcionalidades Principales
- Implementada interfaz de chat básica
- Integración con backend Django
- Soporte para múltiples agentes: IA Generativa, Seguridad, RAG
- Configuración de parámetros RAG
- Soporte multilingüe (ES, EN, PT)