<template>
  <div
      class="min-h-screen flex flex-col"
      :class="isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'"
  >
    <!-- Header -->
    <header class="text-center mt-10">
      <h1
          class="text-4xl font-extrabold mb-2 transition-all"
          :class="isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'"
      >
        {{ $t('aboutMe.title') }}
      </h1>
      <p class="text-lg font-medium">
        {{ $t('aboutMe.subtitle') }}
      </p>
    </header>

    <!-- About Section -->
    <section class="px-4 mt-10">
      <div class="max-w-screen-lg mx-auto text-center">
        <p class="text-lg leading-relaxed">
          {{ $t('aboutMe.description') }}
        </p>
      </div>
    </section>

    <!-- Professional Experience Section -->
    <section class="px-4 mt-10">
      <div class="max-w-screen-lg mx-auto">
        <h2
            class="text-2xl font-bold mb-4 border-b pb-2"
            :class="isDark ? 'text-blue-400 border-gray-600' : 'text-blue-600 border-gray-400'"
        >
          {{ $t('aboutMe.experience_title') }}
        </h2>
        <div
            v-for="(experience, index) in experiences"
            :key="index"
            class="p-6 border rounded-xl shadow-lg mb-6"
            :class="isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-200 border-gray-300'"
        >
          <h3 class="text-xl font-bold mb-2" :class="isDark ? 'text-blue-300' : 'text-blue-600'">
            {{ experience.title }}
          </h3>
          <p class="mb-2 whitespace-pre-line" v-html="experience.description"></p>
          <a
              v-if="experience.url"
              :href="experience.url"
              target="_blank"
              class="text-sm underline"
              :class="isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'"
          >
            {{ experience.urlText }}
          </a>
        </div>
      </div>
    </section>


    <!-- Education Section -->
    <section class="px-4 mt-10">
      <div class="max-w-screen-lg mx-auto">
        <h2
            class="text-2xl font-bold mb-4 border-b pb-2"
            :class="isDark ? 'text-blue-400 border-gray-600' : 'text-blue-600 border-gray-400'"
        >
          {{ $t('aboutMe.education_title') }}
        </h2>
        <div
            v-for="(education, index) in educationDetails"
            :key="index"
            class="flex items-center space-x-4 mb-6"
        >
          <img
              :src="education.image"
              :alt="education.title"
              class="w-16 h-16 object-contain rounded-lg"
          />
          <p class="text-sm">{{ education.description }}</p>
        </div>
      </div>
    </section>

    <!-- Courses Section -->
    <section class="px-4 mt-10">
      <div class="max-w-screen-lg mx-auto">
        <h2
            class="text-2xl font-bold mb-4 border-b pb-2"
            :class="isDark ? 'text-blue-400 border-gray-600' : 'text-blue-600 border-gray-400'"
        >
          {{ $t('aboutMe.courses_title') }}
        </h2>
        <ul class="list-disc list-inside">
          <li v-for="(course, index) in courses" :key="index">{{ course }}</li>
        </ul>
      </div>
    </section>

    <!-- Interests and Hobbies -->
    <section class="px-4 mt-10">
      <div class="max-w-screen-lg mx-auto">
        <h2
            class="text-2xl font-bold mb-4 border-b pb-2"
            :class="isDark ? 'text-blue-400 border-gray-600' : 'text-blue-600 border-gray-400'"
        >
          {{ $t('aboutMe.hobbies_title') }}
        </h2>
        <p><strong>{{ $t('aboutMe.hobbies_label') }}:</strong> {{ $t('aboutMe.hobbies') }}</p>
        <p><strong>{{ $t('aboutMe.interests_label') }}:</strong> {{ $t('aboutMe.interests') }}</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="mt-10 text-center py-4">
      <p class="text-sm">
        &copy; {{ new Date().getFullYear() }} Miguel Murga Guevara. {{ $t('aboutMe.copyright') }}.
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n({
  useScope: 'global',
});

const isDark = computed(() => useColorMode().value === "dark");

// Experiencia profesional
const experiences = computed(() => {
  return locale.value === 'es' 
    ? [
        {
          title: "Full Stack Developer, Harlan Research Hari Harlan Online",
          description: "Junio 2023 - Febrero 2024. Especializado en soluciones avanzadas usando Nuxt 3, Vue 3, VueRouter, Pinia, TypeScript, Tailwind y Elixir.",
          url: "https://github.com/Harlan-Research",
          urlText: "GitHub",
        },
        {
          title: "OCI Generative AI Professional",
          description: `La certificación Oracle Cloud Infrastructure 2024 Generative AI Professional valida la experiencia en la creación e implementación de soluciones impulsadas por IA. Diseñada para Desarrolladores de Software, Ingenieros de Aprendizaje Automático/IA, y Profesionales de IA Generativa, esta certificación destaca la capacidad para utilizar los Servicios de IA Generativa de OCI de manera efectiva.

*Responsabilidades*:
- Diseño e implementación de chatbots con Generación Aumentada por Recuperación (RAG) utilizando Servicios de IA Generativa de OCI para mejorar la recuperación de conocimiento y la participación del usuario.
- Desarrollo de sistemas de búsqueda avanzados con Búsqueda Semántica y bases de datos vectoriales, integrando frameworks como LangChain para una orquestación eficiente de modelos.
- Construcción, evaluación e implementación de aplicaciones LLM en Oracle 23AI, asegurando escalabilidad y optimización para desafíos empresariales del mundo real.
- Colaboración con equipos multifuncionales para definir flujos de trabajo de IA y agilizar canales de entrenamiento de modelos, permitiendo una integración eficiente en sistemas empresariales.
- Proporcionamiento de soporte técnico durante el ciclo de vida de la implementación, incluyendo fases de prueba (E2E, UAT) y mantenimiento posterior a la implementación.

*Habilidades y Herramientas*:
- Competencia en el aprovechamiento de Servicios de IA Generativa de OCI y Oracle 23AI para implementaciones de IA a gran escala.
- Experiencia en Machine Learning (ML) y Deep Learning (DL), incluyendo arquitecturas como CNNs, RNNs y LSTMs.
- Experiencia práctica con flujos de trabajo RAG, LangChain y soluciones de bases de datos vectoriales como Pinecone y Weaviate.
- Familiaridad con Oracle Select AI y Soluciones de IA de OCI para abordar desafíos complejos de datos.

*Logros*:
- Automatización de procesos de recuperación de documentos, mejorando la eficiencia organizacional y reduciendo el esfuerzo manual.
- Entrega de modelos de IA de alto rendimiento que abordaron necesidades específicas del cliente, mejorando la fiabilidad general del sistema.
- Habilitación de una integración fluida de sistemas de IA en infraestructuras existentes a través de documentación clara y componentes reutilizables.

*Detalles de la Certificación*:
- Emitida por Oracle, válida hasta el *30 de julio de 2026*.`,
          url: "https://catalog-education.oracle.com",
          urlText: "Enlace de Certificación",
        },
        {
          title: "Certified Ethical Hacker (CEH)",
          description: `Febrero 2024 - Presente. Experiencia en técnicas de ciberseguridad y pruebas de penetración, incluyendo:
- Enumeración NetBIOS, SNMP, SMTP, DNS.
- Escaneo de configuración IPsec, Protocolo SIP, Análisis VoIP.
- Hacking de sistemas, Amenazas de malware y Técnicas de sniffing.
- Ataques de Denegación de Servicio, Secuestro y Evasión de IDS/Firewalls.
- Hacking de Computación en la Nube e Inyección SQL.`,
          url: "https://www.credential.net",
          urlText: "Enlace de Certificación",
        },
        {
          title: "Prácticas profesionales, BMW Group, Coapa CDMX",
          description: "Rol: Serví como Técnico Electrónico en BMW Coapa, enfocándome en varios aspectos técnicos en un rol de tiempo completo desde enero.",
        },
        {
          title: "Prácticas profesionales, Universidad Politécnica de Puebla, Puebla, México",
          description: `Participé en dos prácticas profesionales bajo la dirección del Profesor Javier Lemus López:
- Enfocadas en 'Amplificadores Operacionales' e 'IoT como solución actual para medidas preventivas'.
- Desarrollo de soluciones para control de acceso a ubicaciones utilizando semáforos basados en códigos QR.`,
        },
        {
          title: "Freelancer",
          description: `Junio 2022 - Presente. Desarrollo de soluciones Frontend y Backend con:
- Frontend: Nuxt 3, Vue 3, VueRouter, Pinia, TypeScript, Tailwind CSS.
- Backend: Django (API REST), GraphQL con Elixir para manejo de datos a gran escala.
- Control de versiones usando Git.`,
        },
        {
          title: "Profesor de Matemáticas, CEMYC, Acapulco de Juárez",
          description: `Apasionado por la enseñanza de matemáticas e inglés:
- Utilicé fuertes habilidades de comunicación e instrucción.
- Diseñé planes de lección atractivos para fomentar el aprendizaje de los estudiantes.`,
        },
      ]
    : [
        {
          title: "Full Stack Developer, Harlan Research Hari Harlan Online",
          description: "June 2023 - February 2024. Specialized in advanced solutions using Nuxt 3, Vue 3, VueRouter, Pinia, TypeScript, Tailwind, and Elixir.",
          url: "https://github.com/Harlan-Research",
          urlText: "GitHub",
        },
        {
          title: "OCI Generative AI Professional",
          description: `The Oracle Cloud Infrastructure 2024 Generative AI Professional certification validates expertise in building and deploying AI-driven solutions. Designed for Software Developers, Machine Learning/AI Engineers, and Gen AI Professionals, this certification highlights the ability to utilize OCI Generative AI Services effectively.

*Responsibilities*:
- Designed and implemented Retrieval-Augmented Generation (RAG) chatbots using OCI Generative AI Services to enhance knowledge retrieval and user engagement.
- Developed advanced search systems with Semantic Search and vector databases, integrating frameworks like LangChain for efficient model orchestration.
- Built, evaluated, and deployed LLM applications on Oracle 23AI, ensuring scalability and optimization for real-world business challenges.
- Collaborated with cross-functional teams to define AI workflows and streamline model training pipelines, enabling efficient integration into enterprise systems.
- Provided technical support during the deployment lifecycle, including testing phases (E2E, UAT) and post-implementation hypercare.

*Skills and Tools*:
- Proficient in leveraging OCI Generative AI Services and Oracle 23AI for large-scale AI deployments.
- Expertise in Machine Learning (ML) and Deep Learning (DL), including architectures such as CNNs, RNNs, and LSTMs.
- Hands-on experience with RAG workflows, LangChain, and vector database solutions like Pinecone and Weaviate.
- Familiarity with Oracle Select AI and OCI AI Solutions for addressing complex data challenges.

*Achievements*:
- Automated document retrieval processes, improving organizational efficiency and reducing manual effort.
- Delivered high-performance AI models that addressed client-specific needs, enhancing overall system reliability.
- Enabled seamless integration of AI systems into existing infrastructures through clear documentation and reusable components.

*Certification Details*:
- Issued by Oracle, valid until *July 30, 2026*.`,
          url: "https://catalog-education.oracle.com",
          urlText: "Certification Link",
        },
        {
          title: "Certified Ethical Hacker (CEH)",
          description: `February 2024 - Present. Expertise in cybersecurity techniques and penetration testing, including:
- NetBIOS, SNMP, SMTP, DNS Enumeration.
- IPsec Configuration Scanning, SIP Protocol, VoIP Analysis.
- System Hacking, Malware Threats, and Sniffing Techniques.
- Denial of Service Attacks, Hijacking, and Evading IDS/Firewalls.
- Cloud Computing Hacking and SQL Injection.`,
          url: "https://www.credential.net",
          urlText: "Certification Link",
        },
        {
          title: "Student Internship, BMW Group, Coapa CDMX",
          description: "Role: Served as an Electronic Technician at BMW Coapa, focusing on various technical aspects in a full-time role from January.",
        },
        {
          title: "Internship, Universidad Politécnica de Puebla, Puebla, México",
          description: `Participated in two professional internships under Professor Javier Lemus López:
- Focused on 'Operational Amplifiers' and 'IoT as the present solution for precautionary measures'.
- Developed solutions for controlling access to locations using QR code-based traffic lights.`,
        },
        {
          title: "Freelancer",
          description: `June 2022 - Present. Developed Frontend and Backend solutions with:
- Frontend: Nuxt 3, Vue 3, VueRouter, Pinia, TypeScript, Tailwind CSS.
- Backend: Django (API REST), GraphQL with Elixir for large-scale data handling.
- Version control using Git.`,
        },
        {
          title: "Math Teacher, CEMYC, Acapulco de Juárez",
          description: `Passionate about teaching math and English:
- Utilized strong communication and instructional skills.
- Designed engaging lesson plans to foster student learning.`,
        },
      ];
});

// Educación
const educationDetails = computed(() => {
  return locale.value === 'es'
    ? [
        {
          title: "Universidad Politécnica de Puebla",
          description: "Ingeniero en Electrónica y Telecomunicaciones (Agosto 2018 - Abril 2023)",
          image: "/img/uppue.png",
        },
        {
          title: "Curso de Hacking Ético",
          description: "Programa de Credenciales IEEE (Septiembre 2023 - Enero 2024)",
          image: "/img/ieee.png",
        },
        {
          title: "Diplomado en Ciencia de Datos",
          description: "ITPE Mérida (Septiembre 2020 - Diciembre 2020)",
          image: "https://gtotech.mx/assets/img/proyectos/itpe_logo.png",
          url: "https://itpe.mx/",
        },
        {
          title: "Técnico Básico e Intermedio en SolidWorks",
          description: "CECATY 83, Ciudad Juárez (Agosto 2020 - Marzo 2021)",
          image: "/img/OIP.jpg",
        },
        {
          title: "Oracle Cloud Infrastructure 2024 Generative AI Certified Professional",
          description: "Oracle University (Julio 2024)",
          image: "/img/OCIU.png",
          url: "https://mylearn.oracle.com/ou/home",
        },
      ]
    : [
        {
          title: "Universidad Politecnica de Puebla",
          description: "Electronic and Telecommunications Engineer (August 2018 - April 2023)",
          image: "/img/uppue.png",
        },
        {
          title: "Ethical Hacking Course",
          description: "IEEE Credentialing Program (September 2023 - January 2024)",
          image: "/img/ieee.png",
        },
        {
          title: "Diploma in Data Science",
          description: "ITPE Mérida (September 2020 - December 2020)",
          image: "https://gtotech.mx/assets/img/proyectos/itpe_logo.png",
          url: "https://itpe.mx/",
        },
        {
          title: "Basic and Intermediate SolidWorks Technician",
          description: "CECATY 83, Ciudad Juárez (August 2020 - March 2021)",
          image: "/img/OIP.jpg",
        },
        {
          title: "Oracle Cloud Infrastructure 2024 Generative AI Certified Professional",
          description: "Oracle University (July 2024)",
          image: "/img/OCIU.png",
          url: "https://mylearn.oracle.com/ou/home",
        },
      ];
});

// Cursos
const courses = computed(() => {
  return locale.value === 'es'
    ? [
        "Nuxt.js: Aplicaciones Universales con Vue.js - Udemy",
        "Aprende Vue 3, Vite, VueRouter, Vuetify, Pinia y TypeScript - Udemy",
        "ESP8266 & Micro Python para Internet de las Cosas - Udemy",
        "Elixir y Phoenix: Programación Funcional para el Mundo Real - Udemy",
        "Proyecto Node-RED y ESP32 - Udemy",
        "Programación Bare-Metal de Sistemas Embebidos (STM32) - Udemy",
      ]
    : [
        "Nuxt.js: Universal Applications with Vue.js - Udemy",
        "Learn Vue 3, Vite, VueRouter, Vuetify, Pinia, and TypeScript - Udemy",
        "ESP8266 & Micro Python for Internet of Things - Udemy",
        "Elixir and Phoenix: Real World Functional Programming - Udemy",
        "Node-RED and ESP32 Project - Udemy",
        "Embedded Systems Bare-Metal Programming (STM32) - Udemy",
      ];
});
</script>