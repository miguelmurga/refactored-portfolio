export interface AIService {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    welcomeMessage: string;
}

export const AI_SERVICES: AIService[] = [
    {
        id: 'cybersecurity',
        name: 'Chatbot Ciber seguridad',
        description: 'Interactúa con un chatbot especializado en ciberseguridad.',
        icon: 'i-heroicons-shield-check',
        color: 'bg-indigo-600',
        welcomeMessage: 'Bienvenido al servicio de Ciberseguridad. ¿En qué puedo ayudarte hoy?'
    },
    {
        id: 'llm',
        name: 'Chatbot sobre LLMs',
        description: 'Obtén información de un chatbot enfocado en LLMs.',
        icon: 'i-heroicons-cpu-chip',
        color: 'bg-emerald-600',
        welcomeMessage: 'Bienvenido al servicio de información sobre LLMs. ¿Qué te gustaría saber?'
    },
    {
        id: 'db-agent',
        name: 'Agente de consulta a una DB',
        description: 'Consulta tu base de datos usando lenguaje natural.',
        icon: 'i-heroicons-database',
        color: 'bg-amber-600',
        welcomeMessage: 'Bienvenido al servicio de consulta de bases de datos. ¿Qué información necesitas recuperar?'
    },
    {
        id: 'knowledge-base',
        name: 'Base de Conocimientos',
        description: 'Consulta nuestra base de conocimientos corporativa.',
        icon: 'i-heroicons-book-open',
        color: 'bg-blue-600',
        welcomeMessage: 'Bienvenido a la Base de Conocimientos. Puedo ayudarte a encontrar información en nuestros documentos internos.'
    }
];

export const SUGGESTIONS = {
    'cybersecurity': [
        '¿Cómo puedo proteger mi red contra ataques ransomware?',
        '¿Cuáles son las mejores prácticas para contraseñas seguras?',
        'Explica qué es un ataque de phishing',
        '¿Cómo implementar Zero Trust en mi organización?'
    ],
    'llm': [
        '¿Cuál es la diferencia entre GPT-3 y GPT-4?',
        'Explica cómo funciona la arquitectura transformer',
        '¿Qué son los embeddings vectoriales?',
        '¿Cómo puedo hacer fine-tuning de un modelo?'
    ],
    'db-agent': [
        'Muestra los 10 clientes con mayor facturación',
        '¿Cuáles son las ventas del último trimestre?',
        'Compara ventas de este año con el anterior',
        'Encuentra productos con poco inventario'
    ],
    'knowledge-base': [
        '¿Cuál es nuestra política de vacaciones?',
        'Muestra el proceso de onboarding para nuevos empleados',
        'Encuentra documentación sobre nuestros productos',
        '¿Dónde puedo encontrar plantillas para presentaciones?'
    ]
};

export function getServiceById(id: string): AIService | undefined {
    return AI_SERVICES.find(service => service.id === id);
}