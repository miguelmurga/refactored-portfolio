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
        id: 'llm_expert',
        apiId: 'llm_expert', // Agente IA Especializado
        name: 'Experto en IA Generativa',
        description: 'Obtén información avanzada sobre modelos de lenguaje y tecnologías de IA generativa',
        icon: 'i-heroicons-cpu-chip',
        color: 'bg-blue-600',
        welcomeMessage: 'Bienvenido al servicio de información sobre IA Generativa. ¿Qué te gustaría saber?',
        model: 'DeepSeek-Coder',
        reasoner: 'Especializado en conceptos de IA. Solo dominio IA Generativa.'
    },
    {
        id: 'unified_agent',
        apiId: 'unified_agent', // Agente Unificado (Chat General)
        name: 'Chat General',
        description: 'Agente unificado que busca en TODOS los dominios (IA + Seguridad)',
        icon: 'i-heroicons-chat-bubble-left-right',
        color: 'bg-gray-600',
        welcomeMessage: 'Bienvenido al Agente Unificado. Puedo ayudarte con consultas de cualquier dominio.',
        model: 'DeepSeek-Coder',
        reasoner: 'Agente modular con acceso a todos los dominios. Razonamiento configurable.'
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
    'llm_expert': [
        '¿Cuál es la diferencia entre GPT-4 y DeepSeek-Coder?',
        'Explica cómo funciona la arquitectura transformer',
        '¿Qué son los embeddings vectoriales?',
        '¿Cómo puedo hacer fine-tuning de un modelo de lenguaje?'
    ],
    'unified_agent': [
        '¿Cómo puedo aprender programación desde cero?',
        'Explica qué es la inteligencia artificial',
        '¿Cuáles son las mejores prácticas de desarrollo?',
        'Ayúdame a resolver un problema de código'
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