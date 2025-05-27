export interface AIService {
    id: string;         // ID lógico usado en nuestra aplicación
    apiId: string;      // ID del servicio tal como se utiliza en las API de Django
    name: string;
    description: string;
    icon: string;
    color: string;
    welcomeMessage: string;
    model?: string;      // Nombre del modelo usado (DeepSeek-Coder)
    reasoner?: string;   // Descripción del razonador usado por el servicio
}

export const AI_SERVICES: AIService[] = [
    {
        id: 'security_expert',
        apiId: 'security_expert', // Este ID debe coincidir con el usado en el backend Django
        name: 'Experto en Ciberseguridad',
        description: 'Obtén asesoramiento especializado en temas de seguridad informática y hacking ético',
        icon: 'i-heroicons-shield-check',
        color: 'bg-green-700',
        welcomeMessage: 'Bienvenido al servicio de Ciberseguridad. ¿En qué puedo ayudarte hoy?',
        model: 'DeepSeek-Coder',
        reasoner: 'Razonador especializado en análisis de vulnerabilidades y evaluación de riesgos de seguridad. Utiliza un enfoque estructurado para identificar posibles brechas de seguridad y recomendar medidas de mitigación adecuadas.'
    },
    {
        id: 'ia_generativa',
        apiId: 'ia_generativa', // Este ID debe coincidir con el usado en el backend Django
        name: 'Experto en IA Generativa',
        description: 'Obtén información avanzada sobre modelos de lenguaje y tecnologías de IA generativa',
        icon: 'i-heroicons-cpu-chip',
        color: 'bg-blue-600',
        welcomeMessage: 'Bienvenido al servicio de información sobre IA Generativa. ¿Qué te gustaría saber?',
        model: 'DeepSeek-Coder',
        reasoner: 'Razonador especializado en conceptos de inteligencia artificial, modelos de lenguaje y procesamiento de datos. Proporciona explicaciones detalladas sobre arquitecturas de modelos y técnicas avanzadas de IA.'
    },
    {
        id: 'rag_conversation',
        apiId: 'rag_conversation', // Este ID debe coincidir con el usado en el backend Django
        name: 'Asistente RAG con MongoDB',
        description: 'Consulta basada en documentos con búsqueda semántica alimentada por MongoDB',
        icon: 'i-heroicons-document-magnifying-glass',
        color: 'bg-emerald-600',
        welcomeMessage: 'Bienvenido al servicio de Generación Aumentada por Recuperación (RAG). Puedo responder preguntas basadas en la información de nuestra base de conocimientos.',
        model: 'DeepSeek-Coder',
        reasoner: 'Sistema de Generación Aumentada por Recuperación que utiliza embeddings de Jina AI y reordenamiento de Cohere para proporcionar respuestas precisas basadas en documentos de la base de conocimientos.'
    }
];

export const SUGGESTIONS = {
    'security_expert': [
        '¿Cómo puedo proteger mi red contra ataques ransomware?',
        '¿Cuáles son las mejores prácticas para contraseñas seguras?',
        'Explica qué es un ataque de phishing',
        '¿Cómo implementar Zero Trust en mi organización?'
    ],
    'ia_generativa': [
        '¿Cuál es la diferencia entre GPT-4 y DeepSeek-Coder?',
        'Explica cómo funciona la arquitectura transformer',
        '¿Qué son los embeddings vectoriales?',
        '¿Cómo puedo hacer fine-tuning de un modelo de lenguaje?'
    ],
    'rag_conversation': [
        '¿Qué son los sistemas RAG y cómo funcionan?',
        '¿Cómo mejora MongoDB la búsqueda semántica?',
        'Explica el proceso de generación de embeddings',
        '¿Cuáles son las ventajas de utilizar Jina AI para embeddings?'
    ]
};

export function getServiceById(id: string): AIService | undefined {
    return AI_SERVICES.find(service => service.id === id);
}