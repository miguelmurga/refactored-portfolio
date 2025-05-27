import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

export default defineI18nConfig(() => ({
    legacy: false,
    locale: 'es',
    fallbackLocale: 'en',
    messages: {
        en,
        es,
        pt
    },
    // Añadir mensajes para errores y rutas especiales
    silentTranslationWarn: true, // Suprimir advertencias de traducciones faltantes
    missingWarn: false,
    fallbackWarn: false
}));
