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
        Miguel Murga Guevara
      </h1>
      <p class="text-lg font-medium">
        Full Stack Developer | Electronics & Telecom Engineer | Industry 4.0 Enthusiast
      </p>
    </header>

    <!-- About Section -->
    <section class="px-4 mt-10">
      <div class="max-w-screen-lg mx-auto text-center">
        <p class="text-lg leading-relaxed">
          Enthusiastic Full Stack Developer specializing in Nuxt 3, Vue 3, and Python. Electronics & Telecom Engineer
          with a passion for Industry 4.0. Quick learner and effective leader, experienced in customer service and education.
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
          Professional Experience
        </h2>
        <div
            v-for="experience in experiences"
            :key="experience.title"
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
          Education
        </h2>
        <div
            v-for="education in educationDetails"
            :key="education.title"
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
          Courses
        </h2>
        <ul class="list-disc list-inside">
          <li v-for="course in courses" :key="course">{{ course }}</li>
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
          Hobbies & Interests
        </h2>
        <p><strong>Hobbies:</strong> 3D Printing, 3D craft</p>
        <p><strong>Interests:</strong> Industry 4.0, Data Science, Machine Learning, Artificial Intelligence, IoT, Embedded Systems, and Robotics</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="mt-10 text-center py-4">
      <p class="text-sm">
        &copy; {{ new Date().getFullYear() }} Miguel Murga Guevara. All rights reserved.
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
const isDark = computed(() => useColorMode().value === "dark");
const experiences = [
  {
    title: "Full Stack Developer, Harlan Research Hari Harlan Online",
    description: "June 2023 - February 2024. Specialized in advanced solutions using Nuxt 3, Vue 3, VueRouter, Pinia, TypeScript, Tailwind, and Elixir.",
    url: "https://github.com/Harlan-Research",
    urlText: "GitHub",
  },
  {
    title: "OCI Generative AI Professional",
    description: `
    The Oracle Cloud Infrastructure 2024 Generative AI Professional certification validates expertise in building and deploying AI-driven solutions. Designed for Software Developers, Machine Learning/AI Engineers, and Gen AI Professionals, this certification highlights the ability to utilize OCI Generative AI Services effectively.

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
    - Issued by Oracle, valid until *July 30, 2026*.
  `,
    url: "https://catalog-education.oracle.com",
    urlText: "Certification Link",
  },
  {
    title: "Certified Ethical Hacker (CEH)",
    description: `
      February 2024 - Present. Expertise in cybersecurity techniques and penetration testing, including:
      - NetBIOS, SNMP, SMTP, DNS Enumeration.
      - IPsec Configuration Scanning, SIP Protocol, VoIP Analysis.
      - System Hacking, Malware Threats, and Sniffing Techniques.
      - Denial of Service Attacks, Hijacking, and Evading IDS/Firewalls.
      - Cloud Computing Hacking and SQL Injection.
    `,
    url: "https://www.credential.net",
    urlText: "Certification Link",
  },
  {
    title: "Student Internship, BMW Group, Coapa CDMX",
    description: "Role: Served as an Electronic Technician at BMW Coapa, focusing on various technical aspects in a full-time role from January.",
  },
  {
    title: "Internship, Universidad Politécnica de Puebla, Puebla, México",
    description: `
      Participated in two professional internships under Professor Javier Lemus López:
      - Focused on 'Operational Amplifiers' and 'IoT as the present solution for precautionary measures'.
      - Developed solutions for controlling access to locations using QR code-based traffic lights.
    `,
  },
  {
    title: "Freelancer",
    description: `
      June 2022 - Present. Developed Frontend and Backend solutions with:
      - Frontend: Nuxt 3, Vue 3, VueRouter, Pinia, TypeScript, Tailwind CSS.
      - Backend: Django (API REST), GraphQL with Elixir for large-scale data handling.
      - Version control using Git.
    `,
  },
  {
    title: "Math Teacher, CEMYC, Acapulco de Juárez",
    description: `
      Passionate about teaching math and English:
      - Utilized strong communication and instructional skills.
      - Designed engaging lesson plans to foster student learning.
    `,
  },
];


const educationDetails = [
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

const courses = [
  "Nuxt.js: Universal Applications with Vue.js - Udemy",
  "Learn Vue 3, Vite, VueRouter, Vuetify, Pinia, and TypeScript - Udemy",
  "ESP8266 & Micro Python for Internet of Things - Udemy",
  "Elixir and Phoenix: Real World Functional Programming - Udemy",
  "Node-RED and ESP32 Project - Udemy",
  "Embedded Systems Bare-Metal Programming (STM32) - Udemy",
];
</script>