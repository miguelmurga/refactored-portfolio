<template>
  <div class="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar (visible in desktop, hidden in mobile) -->
    <div class="hidden md:flex md:w-64 bg-gray-800 dark:bg-gray-900 text-white flex-col border-r border-gray-700">
      <!-- New conversation button -->
      <div class="p-4">
        <UButton 
          block
          color="white" 
          variant="ghost" 
          class="border border-gray-700 dark:border-gray-700 justify-between"
          @click="showServiceSelector = true"
        >
          <span>{{ $t('chat.new_chat') }}</span>
          <UIcon name="i-heroicons-plus" />
        </UButton>
      </div>

      <!-- Recent conversations -->
      <div class="flex-1 overflow-y-auto px-3 pb-3">
        <h3 class="px-3 py-2 text-xs font-medium text-gray-400 uppercase">
          {{ $t('chat.recent_conversations') }}
        </h3>
        <div v-if="chatStore.isLoading" class="py-4 text-center">
          <UProgress class="w-20 mx-auto" color="primary" :model-value="null" />
        </div>
        <template v-else-if="conversations.length === 0">
          <p class="text-gray-400 text-sm text-center py-4">
            {{ $t('chat.no_conversations_yet', 'No hay conversaciones aún') }}
          </p>
        </template>
        <template v-else>
          <div
            v-for="conv in conversations"
            :key="conv.id"
            @click="navigateToConversation(conv.id)"
            class="group flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors"
            :class="{'bg-gray-700': Number(route.params.id) === conv.id}"
          >
            <UIcon 
              :name="getServiceIcon(conv.service)" 
              class="flex-shrink-0" 
              :class="getServiceColor(conv.service).replaceAll('bg-', 'text-')"
            />
            <div class="flex-1 overflow-hidden">
              <div class="line-clamp-1 text-sm group-hover:hidden">{{ conv.title || getServiceName(conv.service) }}</div>
              <div class="hidden group-hover:flex items-center gap-1">
                <UButton
                  color="white"
                  variant="ghost"
                  icon="i-heroicons-pencil"
                  size="xs"
                  @click.stop="editConversationTitle(conv)"
                  class="opacity-0 group-hover:opacity-100"
                />
                <span class="truncate">{{ conv.title || getServiceName(conv.service) }}</span>
              </div>
              <div class="text-xs text-gray-400 flex justify-between">
                <span>{{ formatDate(new Date(conv.lastUpdated)) }}</span>
                <span v-if="conv.language" class="uppercase">{{ conv.language }}</span>
              </div>
            </div>
            <UButton
              v-if="Number(route.params.id) === conv.id"
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              @click.stop="confirmDelete = true"
              class="opacity-0 group-hover:opacity-100"
            />
          </div>
        </template>
      </div>

      <!-- Language selector -->
      <div class="border-t border-gray-700 p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm font-medium">{{ $t('language') || 'Idioma' }}</div>
        </div>
        <USelectMenu
          v-model="selectedLanguage"
          :options="languageOptions"
          option-attribute="label"
          value-attribute="value"
          size="sm"
          class="w-full text-gray-800 dark:text-white"
          @change="changeLanguage"
        />
      </div>
    </div>

    <!-- Mobile header (visible only on small devices) -->
    <div class="md:hidden flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-bars-3"
          color="gray" 
          variant="ghost"
          @click="mobileMenuOpen = true"
        />
        <div class="font-semibold">{{ getCurrentServiceName() }}</div>
      </div>
      <UButton
        icon="i-heroicons-plus"
        color="gray"
        variant="ghost"
        @click="showServiceSelector = true"
      />
    </div>
    
    <!-- Main chat area -->
    <div class="flex-1 flex flex-col">
      <!-- Chat active header (only visible in tablets/desktop) -->
      <ChatHeader 
        v-if="currentConversation" 
        :title="currentConversation.title || getCurrentServiceName()" 
        :service-id="currentConversation.service" 
        :message-count="currentMessages.length"
        class="hidden md:block"
        @delete="confirmDelete = true"
        @info="showInfoModal = true"
        @refresh="refreshConversations"
      />
      
      <!-- Legacy header (only as fallback) -->
      <div v-else class="hidden md:flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-3 px-5 items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="getCurrentServiceColor()">
            <UIcon :name="getCurrentServiceIcon()" class="text-white" />
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ getCurrentServiceName() }}</span>
            <UButton
              icon="i-heroicons-pencil"
              size="xs"
              color="gray"
              variant="ghost"
              @click="editConversationTitle(currentConversation)"
              v-if="currentConversation"
              class="opacity-70 hover:opacity-100"
            />
          </div>
          <UBadge size="sm" color="gray" class="ml-1">{{ getCurrentModelName() }}</UBadge>
          <UBadge v-if="currentConversation?.language" size="sm" color="gray" class="uppercase">
            {{ currentConversation.language }}
          </UBadge>
        </div>
        
        <div class="flex items-center gap-2">
          <UButton
            v-if="isRAGService"
            color="gray"
            variant="ghost"
            icon="i-heroicons-adjustments-horizontal"
            @click="showRagOptions = true"
            title="Configure RAG options"
          />
          
          <UButton
            v-if="isRAGService"
            color="gray"
            variant="ghost"
            icon="i-heroicons-document-plus"
            @click="showUploadDocument = true"
            title="Upload document"
          />
          
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-information-circle"
            @click="showInfoModal = true"
          />
          
          <ThemeToggle />
        </div>
      </div>
      
      <!-- Chat messages -->
      <div class="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-6" ref="messagesContainer">
        <div class="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <!-- Welcome message if new conversation -->
          <div v-if="currentMessages.length === 0" class="flex items-start">
            <div class="w-8 h-8 rounded-full flex items-center justify-center mr-2 sm:mr-4 flex-shrink-0" :class="getCurrentServiceColor()">
              <UIcon :name="getCurrentServiceIcon()" class="text-white" />
            </div>
            <div class="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow max-w-[85%] sm:max-w-[75%]">
              <div v-html="getWelcomeMessage()" class="prose prose-sm dark:prose-invert max-w-none"></div>
            </div>
          </div>
          
          <!-- Conversation messages -->
          <div 
            v-for="message in currentMessages" 
            :key="`${message.id || 'temp-' + Math.random().toString(36)}-${message._time || message._timestamp || message.created_at || Date.now()}`"
            :class="message.role === 'user' ? 'flex flex-row-reverse' : 'flex'"
          >
            <!-- User avatar -->
            <template v-if="message.role === 'user'">
              <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center ml-2 sm:ml-4 flex-shrink-0">
                <UIcon name="i-heroicons-user" class="text-white" />
              </div>
            </template>
            
            <!-- Assistant avatar -->
            <template v-else>
              <div class="w-8 h-8 rounded-full flex items-center justify-center mr-2 sm:mr-4 flex-shrink-0" :class="getCurrentServiceColor()">
                <UIcon :name="getCurrentServiceIcon()" class="text-white" />
              </div>
            </template>
            
            <!-- Message content -->
            <div 
              :class="message.role === 'user' 
                ? 'bg-blue-600 text-white dark:bg-blue-700 rounded-lg shadow p-3 sm:p-4 max-w-[80%] sm:max-w-[70%]' 
                : 'bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 max-w-[80%] sm:max-w-[70%]'"
            >
              <div v-if="message.status && message.status !== 'completed'" class="mb-2">
                <UBadge color="yellow" size="sm">
                  {{ message.status === 'processing' ? 'Procesando...' : message.status }}
                </UBadge>
              </div>
              
              <div v-html="formatMessageContent(message.content)" class="prose prose-sm dark:prose-invert max-w-none break-words"></div>
              
              <!-- Sources and context for assistant messages -->
              <div v-if="message.role === 'assistant' && message.context_data && message.context_data.length > 0" class="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                <UButton 
                  size="xs" 
                  color="gray" 
                  variant="ghost" 
                  @click="toggleContext(message.id)" 
                  class="flex items-center mb-2">
                  <UIcon 
                    :name="isContextVisible(message.id) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" 
                    class="mr-1"
                  />
                  {{ isContextVisible(message.id) ? $t('rag.hide_sources') : $t('rag.show_sources') }} ({{ message.context_data.length }})
                </UButton>
                
                <div v-if="isContextVisible(message.id)" class="space-y-2">
                  <div v-for="(source, idx) in message.context_data" :key="idx" class="p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs">
                    <div class="flex justify-between mb-1 flex-wrap gap-1">
                      <div class="font-medium">{{ source.title || 'Documento' }}</div>
                      <div class="text-gray-500">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {{ Math.round((source.rerank_score || source.score || 0) * 100) }}% relevancia
                        </span>
                      </div>
                    </div>
                    <div class="line-clamp-2 text-gray-600 dark:text-gray-400">{{ source.text }}</div>
                    <div v-if="source.domain" class="mt-1">
                      <span class="text-xs text-gray-500">Dominio: {{ source.domain }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Action buttons for assistant messages -->
              <div v-if="message.role === 'assistant'" class="mt-2 sm:mt-3 flex justify-end gap-2">
                <UButton size="xs" color="gray" variant="ghost" icon="i-heroicons-document-duplicate" @click="copyToClipboard(message.content)">
                  {{ $t('chat.copy') || 'Copiar' }}
                </UButton>
              </div>
            </div>
          </div>
          
          <!-- Typing indicator -->
          <div v-if="isTyping || isPollingMessageStatus" class="flex">
            <div class="w-8 h-8 rounded-full flex items-center justify-center mr-2 sm:mr-4 flex-shrink-0" :class="getCurrentServiceColor()">
              <UIcon :name="getCurrentServiceIcon()" class="text-white" />
            </div>
            <div class="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow max-w-[70%]">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Text input with advanced buttons -->
      <div class="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 sm:p-4">
        <div class="max-w-3xl mx-auto">
          <!-- DIP Switch Configuration Bar (solo visible para servicios RAG) -->
          <ChatConfigBar 
            v-if="isRAGService"
            :config="ragConfig" 
            @update:config="ragConfig = $event"
            class="mb-3"
            @show-advanced="showRagOptions = true"
          />
          
          <form @submit.prevent="sendMessage" class="relative">
            <UTextarea
              v-model="inputMessage"
              :placeholder="hasReachedMessageLimit ? '⛔ Límite de 20 mensajes alcanzado. Inicia una nueva conversación.' : ($t('chat.type_message') || 'Escribe tu mensaje...')"
              autoresize
              class="w-full pr-20 sm:pr-24 rounded-lg border"
              :class="hasReachedMessageLimit ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500'"
              :rows="1"
              :maxRows="5"
              @keydown.enter.prevent="handleEnterKey"
              :disabled="isTyping || isPollingMessageStatus || hasReachedMessageLimit"
            />
            <div class="absolute right-2 sm:right-3 bottom-2 sm:bottom-2.5 flex space-x-1 sm:space-x-2">
              <UButton
                v-if="isRAGService"
                color="gray"
                variant="ghost"
                icon="i-heroicons-cog-6-tooth"
                size="sm"
                class="sm:hidden"
                title="Configuration"
                @click="showRagOptions = true"
              />
              <UButton
                color="blue"
                variant="solid"
                icon="i-heroicons-paper-airplane"
                size="sm" 
                class="rounded-lg"
                :disabled="!inputMessage.trim() || isTyping || isPollingMessageStatus || hasReachedMessageLimit"
                type="submit"
                aria-label="Send message"
              />
            </div>
          </form>
          
          <!-- Contador de mensajes y límite -->
          <div v-if="currentMessages.length > 0" class="text-xs text-gray-500 dark:text-gray-400 text-right mt-1 mb-2">
            <span :class="currentMessages.length >= 15 ? 'text-orange-600 dark:text-orange-400 font-medium' : 
                          currentMessages.length >= 20 ? 'text-red-600 dark:text-red-400 font-bold' : ''">
              {{ currentMessages.length }}/20 mensajes
            </span>
            <span v-if="currentMessages.length >= 15 && currentMessages.length < 20" class="ml-2 text-orange-600 dark:text-orange-400">
              ⚠️ Acercándose al límite
            </span>
            <span v-else-if="currentMessages.length >= 20" class="ml-2 text-red-600 dark:text-red-400">
              ⛔ Límite alcanzado
            </span>
          </div>
          
          <!-- Mensaje informativo de estado de configuración -->
          <div class="text-xs text-gray-500 dark:text-gray-400 text-right mt-2">
            <div v-if="isRAGService && !ragConfig.use_rag" class="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-2 rounded text-center mb-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline-block mr-1" />
              RAG está desactivado. Las respuestas no utilizarán la base de conocimientos.
            </div>
            <div class="flex flex-wrap justify-between">
              <span v-if="isRAGService" class="flex items-center">
                <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-1" />
                {{ ragConfig.model }} {{ ragConfig.use_reasoner ? '+ Razonador' : '' }}
                <span v-if="ragConfig.use_rag" class="ml-2">
                  <UIcon name="i-heroicons-document-magnifying-glass" class="w-4 h-4 mr-1" />
                  {{ formatDomain(ragConfig.domain) }}
                </span>
              </span>
              <span v-else>
                <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 mr-1" />
                {{ getCurrentModelName() }} {{ ragConfig.use_reasoner ? '+ Razonador' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Service selector modal -->
    <UModal v-model="showServiceSelector">
      <UCard class="max-w-xl mx-auto w-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ $t('chat.select_service') || 'Select service' }}</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showServiceSelector = false"
            />
          </div>
        </template>
        
        <div class="space-y-4">
          <!-- Agentes Especializados (RAG siempre activado) -->
          <div>
            <h5 class="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">🤖 Agentes Especializados (RAG Siempre ON)</h5>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <template v-for="service in mainServices.filter(s => s.ragAlwaysOn)" :key="service.id">
                <div
                  @click="() => { if (!isCreatingConversation) { createConversation(service.apiId); showServiceSelector = false; } }"
                  class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
                  :class="{'cursor-pointer': !isCreatingConversation, 'cursor-not-allowed opacity-50': isCreatingConversation}"
                >
                  <div class="text-center">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto" :class="service.color">
                      <UIcon :name="service.icon" class="text-white text-lg" />
                    </div>
                    <h4 class="font-medium mb-1">{{ service.name }}</h4>
                    <UBadge size="sm" color="emerald" variant="solid" class="mb-2">RAG SIEMPRE ON</UBadge>
                    <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {{ service.description }}
                    </p>
                    <div class="text-xs text-gray-400 mt-1">→ {{ service.endpoint }}</div>
                  </div>
                </div>
              </template>
            </div>
          </div>
          
          <!-- Chat General (RAG configurable) -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h5 class="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">💬 Chat General (RAG Configurable)</h5>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Único endpoint que permite activar/desactivar RAG</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Chat General CON RAG -->
              <div
                @click="() => { if (!isCreatingConversation) { createConversation('llm', true); showServiceSelector = false; } }"
                class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all"
                :class="{'cursor-pointer': !isCreatingConversation, 'cursor-not-allowed opacity-50': isCreatingConversation}"
              >
                <div class="text-center">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto bg-green-600">
                    <UIcon name="i-heroicons-chat-bubble-left-right" class="text-white text-lg" />
                  </div>
                  <h4 class="font-medium mb-1">Chat CON RAG</h4>
                  <UBadge size="sm" color="emerald" variant="subtle" class="mb-2">use_rag: true</UBadge>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    LLM general con acceso a documentos
                  </p>
                  <div class="text-xs text-gray-400 mt-1">→ /api/chat/ + RAG</div>
                </div>
              </div>
              
              <!-- Chat General SIN RAG -->
              <div
                @click="() => { if (!isCreatingConversation) { createConversation('llm', false); showServiceSelector = false; } }"
                class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md transition-all"
                :class="{'cursor-pointer': !isCreatingConversation, 'cursor-not-allowed opacity-50': isCreatingConversation}"
              >
                <div class="text-center">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto bg-gray-600">
                    <UIcon name="i-heroicons-chat-bubble-left-right" class="text-white text-lg" />
                  </div>
                  <h4 class="font-medium mb-1">Chat SIN RAG</h4>
                  <UBadge size="sm" color="gray" variant="subtle" class="mb-2">use_rag: false</UBadge>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Solo modelo LLM, sin documentos
                  </p>
                  <div class="text-xs text-gray-400 mt-1">→ /api/chat/ (solo LLM)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </UModal>
    
    <!-- Delete confirmation modal -->
    <UModal v-model="confirmDelete">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ $t('chat.confirm_delete') || 'Confirm deletion' }}</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="confirmDelete = false"
            />
          </div>
        </template>
        <p>{{ $t('chat.delete_confirmation') || 'Are you sure you want to delete this conversation? This action cannot be undone.' }}</p>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="gray"
              variant="outline"
              @click="confirmDelete = false"
            >
              {{ $t('common.cancel') || 'Cancel' }}
            </UButton>
            <UButton
              color="red"
              variant="solid"
              @click="deleteConversation"
            >
              {{ $t('common.delete') || 'Delete' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
    
    <!-- Model information modal -->
    <UModal v-model="showInfoModal">
      <UCard class="max-w-lg">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ getCurrentServiceName() }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showInfoModal = false"
            />
          </div>
        </template>
        
        <div>
          <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm mb-4">
            {{ getCurrentServiceDescription() }}
          </div>
          
          <div class="mt-4">
            <div class="text-sm font-medium mb-2">{{ $t('rag.base_model') }}:</div>
            <UBadge color="blue" class="mb-4">{{ getCurrentModelName() }}</UBadge>
            
            <div class="mt-3 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <h5 class="text-sm font-medium mb-2">{{ $t('rag.reasoner') }}:</h5>
              <div class="flex items-center mb-2">
                <UToggle v-model="ragConfig.use_reasoner" />
                <span class="ml-2 text-sm">{{ ragConfig.use_reasoner ? $t('common.yes') : $t('common.no') }}</span>
              </div>
              <p class="text-sm">{{ getCurrentServiceReasoner() }}</p>
            </div>

            <div v-if="isRAGService" class="mt-4">
              <div class="text-sm font-medium mb-2">{{ $t('rag.config_title') }}:</div>
              
              <div class="flex items-center mb-2">
                <UToggle v-model="ragConfig.use_rag" />
                <span class="ml-2 text-sm">{{ ragConfig.use_rag ? $t('common.yes') : $t('common.no') }}</span>
              </div>
              
              <div v-if="ragConfig.use_rag" class="grid grid-cols-2 gap-2 text-sm">
                <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                  <div class="font-medium">{{ $t('rag.domain') }}:</div>
                  <div>{{ formatDomain(ragConfig.domain) }}</div>
                </div>
                <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                  <div class="font-medium">{{ $t('rag.similarity') }}:</div>
                  <div>{{ ragConfig.similarity_metric === 'cosine' ? 'Coseno' : 'Euclídea' }}</div>
                </div>
                <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                  <div class="font-medium">{{ $t('rag.use_rerank') }}:</div>
                  <div>{{ ragConfig.use_rerank ? $t('common.yes') : $t('common.no') }}</div>
                </div>
                <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                  <div class="font-medium">{{ $t('rag.use_mmr') }}:</div>
                  <div>{{ ragConfig.use_mmr ? $t('common.yes') : $t('common.no') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <template #footer>
          <UButton
            color="blue"
            variant="solid"
            @click="showInfoModal = false"
          >
            {{ $t('common.close') || 'Close' }}
          </UButton>
        </template>
      </UCard>
    </UModal>

    <!-- Model selection modal -->
    <UModal v-model="showModelModal">
      <UCard class="max-w-lg">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ $t('rag.select_model') }}</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showModelModal = false"
            />
          </div>
        </template>
        
        <div class="space-y-4">
          <URadio 
            v-model="ragConfig.model" 
            value="deepseek-chat" 
            label="DeepSeek Chat" 
            help="Modelo para respuestas estándar"
          />
          <URadio 
            v-model="ragConfig.model" 
            value="deepseek-reasoner" 
            label="DeepSeek Reasoner" 
            help="Modelo con razonamiento paso a paso"
          />
        </div>
        
        <template #footer>
          <div class="flex justify-end">
            <UButton
              color="blue"
              variant="solid"
              @click="showModelModal = false"
            >
              {{ $t('common.save') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- RAG options modal -->
    <UModal v-model="showRagOptions">
      <UCard class="max-w-lg">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ $t('rag.config_title') }}</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showRagOptions = false"
            />
          </div>
        </template>
        
        <div class="space-y-4">
          <div class="border-b pb-3">
            <div class="font-medium mb-3">{{ $t('rag.general_options') }}</div>
            <div class="flex justify-between items-center mb-2">
              <div>
                <UToggle v-model="ragConfig.use_rag" />
                <span class="ml-2">{{ $t('rag.use_rag') }}</span>
              </div>
              <div>
                <UToggle v-model="ragConfig.use_reasoner" />
                <span class="ml-2">{{ $t('rag.use_reasoner') }}</span>
              </div>
            </div>
            <div class="flex justify-between items-center mb-2">
              <UFormGroup :label="$t('rag.model')">
                <USelectMenu
                  v-model="ragConfig.model"
                  :options="[
                    { label: 'DeepSeek Chat', value: 'deepseek-chat' },
                    { label: 'DeepSeek Reasoner', value: 'deepseek-reasoner' }
                  ]"
                  size="sm"
                />
              </UFormGroup>
            </div>
            <div class="mt-2 mb-3 bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-xs">
              <p class="mb-1"><strong>Embeddings:</strong> {{ ragConfig.model_name }}</p>
              <p><strong>Reranking:</strong> {{ ragConfig.rerank_model }}</p>
            </div>
          </div>
          
          <div v-if="ragConfig.use_rag">
            <UFormGroup :label="$t('rag.domain')">
              <URadio v-model="ragConfig.domain" value="todos" :label="$t('rag.all_domains')" />
              <URadio v-model="ragConfig.domain" value="ciberseguridad" :label="$t('rag.cybersecurity')" />
              <URadio v-model="ragConfig.domain" value="ia_generativa" :label="$t('rag.generative_ai')" />
            </UFormGroup>
          </div>
          
          <div v-if="ragConfig.use_rag">
            <div class="font-medium mb-2">{{ $t('rag.similarity') }}</div>
            <URadio 
              v-model="ragConfig.similarity_metric" 
              value="cosine" 
              :label="$t('rag.cosine')" 
              :help="$t('rag.cosine_help')"
            />
            <URadio 
              v-model="ragConfig.similarity_metric" 
              value="euclidean" 
              :label="$t('rag.euclidean')"
              :help="$t('rag.euclidean_help')"
            />
          </div>
          
          <div v-if="ragConfig.use_rag" class="border-t pt-3">
            <div class="font-medium mb-2">{{ $t('rag.ranking_techniques') }}</div>
            <UToggle v-model="ragConfig.use_rerank" :label="$t('rag.use_rerank_label')" />
            <UToggle v-model="ragConfig.use_mmr" :label="$t('rag.use_mmr_label')" />
          </div>
          
          <div v-if="ragConfig.use_rag" class="grid grid-cols-2 gap-3 border-t pt-3">
            <UFormGroup :label="$t('rag.min_score')">
              <UInput 
                v-model.number="ragConfig.min_score" 
                type="number" 
                min="0" 
                max="0.99" 
                step="0.05"
              />
            </UFormGroup>
            
            <UFormGroup :label="$t('rag.min_rerank_score')">
              <UInput 
                v-model.number="ragConfig.min_rerank_score" 
                type="number" 
                min="0" 
                max="0.99" 
                step="0.05"
                :disabled="!ragConfig.use_rerank"
              />
            </UFormGroup>
            
            <UFormGroup :label="$t('rag.top_k')">
              <UInput 
                v-model.number="ragConfig.top_k" 
                type="number" 
                min="1" 
                max="20" 
                step="1"
              />
            </UFormGroup>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-between">
            <UButton
              color="gray"
              variant="outline"
              @click="resetRagConfig"
            >
              {{ $t('rag.reset') || 'Reset' }}
            </UButton>
            <UButton
              color="blue"
              variant="solid"
              @click="showRagOptions = false"
            >
              {{ $t('common.save') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Edit conversation title modal -->
    <UModal v-model="editingTitle">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Cambiar nombre de conversación</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="editingTitle = false"
            />
          </div>
        </template>
        
        <UFormGroup>
          <UInput
            v-model="newTitle"
            placeholder="Nombre de la conversación"
            class="w-full"
            autofocus
            @keyup.enter="saveConversationTitle"
          />
        </UFormGroup>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="gray"
              variant="outline"
              @click="editingTitle = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="blue"
              variant="solid"
              @click="saveConversationTitle"
            >
              Guardar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
    
    <!-- Document upload modal -->
    <UModal v-model="showUploadDocument">
      <UCard class="max-w-lg">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ $t('rag.upload_document') }}</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showUploadDocument = false"
            />
          </div>
        </template>
        
        <div class="space-y-4">
          <UFormGroup :label="$t('rag.document_domain')">
            <URadio v-model="uploadDomain" value="ciberseguridad" :label="$t('rag.cybersecurity')" />
            <URadio v-model="uploadDomain" value="ia_generativa" :label="$t('rag.generative_ai')" />
          </UFormGroup>
          
          <UFormGroup :label="$t('rag.document_file')">
            <div class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center">
              <div class="space-y-2">
                <UIcon name="i-heroicons-document-text" class="w-8 h-8 mx-auto text-gray-400" />
                <div class="text-sm font-medium">{{ $t('rag.drag_file') }}</div>
                <div class="text-xs text-gray-500">{{ $t('rag.file_types') }}</div>
                <UButton size="sm" color="blue" variant="soft" class="mt-2" @click="triggerFileInput">
                  {{ $t('rag.select_file') }}
                </UButton>
              </div>
              <input type="file" ref="fileInput" class="hidden" @change="handleFileSelected" accept=".pdf,.docx,.txt,.md" />
            </div>
            <div v-if="selectedFile" class="mt-2 text-sm text-blue-600 dark:text-blue-400">
              {{ $t('rag.selected_file') }}: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </div>
          </UFormGroup>
          
          <UFormGroup :label="$t('rag.document_title')">
            <UInput v-model="uploadTitle" :placeholder="$t('rag.title_placeholder')" />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="gray"
              variant="outline"
              @click="showUploadDocument = false"
            >
              {{ $t('common.cancel') }}
            </UButton>
            <UButton
              color="blue"
              variant="solid"
              @click="uploadDocument"
              :disabled="!selectedFile || !uploadDomain"
              :loading="isUploading"
            >
              {{ $t('rag.upload') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Mobile slideover menu -->
    <USlideover v-model="mobileMenuOpen" side="left">
      <div class="bg-gray-800 dark:bg-gray-900 text-white flex flex-col h-full p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">{{ $t('common.ai_chat') || 'AI Chat' }}</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="mobileMenuOpen = false"
          />
        </div>

        <!-- New conversation button -->
        <UButton 
          block
          color="white" 
          variant="ghost" 
          class="border border-gray-700 justify-between mb-4"
          @click="() => { showServiceSelector = true; mobileMenuOpen = false; }"
        >
          <span>{{ $t('chat.new_chat') || 'New conversation' }}</span>
          <UIcon name="i-heroicons-plus" />
        </UButton>
        
        <!-- Mobile conversations -->
        <div class="flex-1 overflow-y-auto">
          <h3 class="px-3 py-2 text-xs font-medium text-gray-400 uppercase">
            {{ $t('chat.recent_conversations') || 'Recent conversations' }}
          </h3>
          <div v-if="chatStore.isLoading" class="py-4 text-center">
            <UProgress class="w-20 mx-auto" color="primary" :model-value="null" />
          </div>
          <template v-else-if="conversations.length === 0">
            <p class="text-gray-400 text-sm text-center py-4">
              {{ $t('chat.no_conversations_yet', 'No hay conversaciones aún') }}
            </p>
          </template>
          <template v-else>
            <div
              v-for="conv in conversations"
              :key="conv.id"
              @click="() => { navigateToConversation(conv.id); mobileMenuOpen = false; }"
              class="group flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-gray-700 transition-colors"
              :class="{'bg-gray-700': Number(route.params.id) === conv.id}"
            >
              <UIcon 
                :name="getServiceIcon(conv.service)" 
                class="flex-shrink-0" 
                :class="getServiceColor(conv.service).replaceAll('bg-', 'text-')"
              />
              <div class="flex-1 overflow-hidden">
                <div class="line-clamp-1 text-sm">{{ conv.title || getServiceName(conv.service) }}</div>
                <div class="text-xs text-gray-400">
                  {{ formatDate(new Date(conv.lastUpdated)) }}
                </div>
              </div>
              <UButton
                v-if="Number(route.params.id) === conv.id"
                color="red"
                variant="ghost"
                icon="i-heroicons-trash"
                size="xs"
                @click.stop="confirmDelete = true"
              />
            </div>
          </template>
        </div>
        
        <!-- Mobile language selector -->
        <div class="border-t border-gray-700 pt-4 mt-2">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm font-medium">{{ $t('language') || 'Language' }}</div>
          </div>
          <USelectMenu
            v-model="selectedLanguage"
            :options="languageOptions"
            option-attribute="label"
            value-attribute="value"
            size="sm"
            class="w-full text-gray-800 dark:text-white"
            @change="changeLanguage"
          />
        </div>
      </div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { useChatStore } from '~/stores/chatStore';
import { useI18n } from 'vue-i18n';
import { useApiService } from '~/composables/useApiService';
import { useSession } from '~/composables/useSession';
import { useConversationController } from '~/composables/useConversationController';
import { useRoute, useRouter } from 'vue-router';
import ChatConfigBar from '~/components/chat/ChatConfigBar.vue';
import ChatHeader from '~/components/chat/ChatHeader.vue';

// Pinia store with error handling
let chatStore;
try {
  chatStore = useChatStore();
} catch (error) {
  console.error('Error initializing chatStore:', error);
  // Provide fallback object to prevent errors
  chatStore = {
    isLoading: false,
    isTyping: false,
    currentConversation: null,
    currentMessages: [],
    currentConversationId: null,
    conversations: []
  };
}

const { t, locale } = useI18n();
const apiService = useApiService();
const conversationController = useConversationController();
const route = useRoute();
const router = useRouter();

// Local state
const inputMessage = ref('');
const showServiceSelector = ref(false);
const confirmDelete = ref(false);
const showInfoModal = ref(false);
const showRagOptions = ref(false);
const showUploadDocument = ref(false);
const showModelModal = ref(false);
const mobileMenuOpen = ref(false);
const messagesContainer = ref(null);
const selectedLanguage = ref(locale.value);
const visibleContextIds = ref(new Set());
const isPollingMessageStatus = ref(false);
const pollingInterval = ref(null);
const fileInput = ref(null);
const selectedFile = ref(null);
const uploadDomain = ref('ia_generativa');
const uploadTitle = ref('');
const isUploading = ref(false);

// Configuration RAG with options for use_rag, use_reasoner and model
// Utilizamos los valores indicados en la documentación de CLAUDE.md
const ragConfig = ref({
  use_rag: true,              // Option to activate/deactivate RAG
  use_reasoner: false,        // Option to activate/deactivate reasoner (off by default)
  model: 'deepseek-chat',     // Model to use (deepseek-chat or deepseek-reasoner)
  domain: 'todos',            // Default to search all domains, will be updated based on service
  similarity_metric: 'cosine', // Use Jina AI embeddings with cosine similarity
  use_mmr: true,              // Enable Maximal Marginal Relevance
  use_rerank: true,           // Enable Cohere Rerank
  min_score: 0.30,            // Umbral inicial de similitud vectorial: 0.30 (≈ cos 72°)
  min_rerank_score: 0.35,     // Umbral de relevancia para Cohere Rerank: 0.35
  top_k: 5,                   // Number of results to retrieve
  model_name: 'jina-embeddings-v3', // Modelo específico de Jina AI
  rerank_model: 'rerank-multilingual-v3.0', // Modelo de Cohere Rerank
  llm_temperature: 0.7,       // Temperatura del LLM
  // Inicializar el idioma de la aplicación y las peticiones con orden de prioridad claro
  language: getInitialLanguage() // Función para obtener el idioma inicial de forma consistente
});

// Función para obtener el idioma inicial de forma consistente
function getInitialLanguage(): string {
  // Default language
  const defaultLang = 'es';
  
  if (typeof window === 'undefined' || !localStorage) {
    return defaultLang;
  }
  
  // 1. Primera prioridad: Idioma explícitamente seleccionado por el usuario
  const selectedLang = localStorage.getItem('selectedLanguage');
  if (selectedLang) {
    console.log(`[Chat] Using user selected language from localStorage: ${selectedLang}`);
    return selectedLang;
  }
  
  // 2. Segunda prioridad: Idioma de la UI (i18n)
  if (locale?.value) {
    console.log(`[Chat] Using i18n locale: ${locale.value}`);
    return locale.value;
  }
  
  // 3. Tercera prioridad: Idioma almacenado por nuxt-i18n
  const i18nLang = localStorage.getItem('nuxt-locale');
  if (i18nLang) {
    console.log(`[Chat] Using nuxt-i18n locale from localStorage: ${i18nLang}`);
    return i18nLang;
  }
  
  // 4. Default como último recurso
  console.log(`[Chat] No language preference found, using default: ${defaultLang}`);
  return defaultLang;
}

// Define ALL available services - specialized endpoints have fixed RAG, only /api/chat/ is configurable (SYNCHRONIZED with index.vue)
const mainServices = [
  {
    id: 'ia_generativa',
    apiId: 'ia_generativa',
    name: 'Experto en IA Generativa',
    description: 'Experto en inteligencia artificial y modelos de lenguaje con documentos especializados',
    icon: 'i-heroicons-cpu-chip',
    color: 'bg-blue-600',
    model: 'DeepSeek-Coder',
    reasoner: 'Especializado en transformers, attention, redes neuronales. RAG siempre activado con documentos de IA.',
    endpoint: '/api/llm-expert/',
    ragFixed: true,
    ragAlwaysOn: true
  },
  {
    id: 'security_expert',
    apiId: 'security_expert',
    name: 'Experto en Ciberseguridad',
    description: 'Experto en seguridad informática y hacking ético con documentos ETHPA',
    icon: 'i-heroicons-shield-check',
    color: 'bg-green-600',
    model: 'DeepSeek-Coder',
    reasoner: 'Especializado en vulnerabilidades, pentesting, seguridad. RAG siempre activado con documentos de seguridad.',
    endpoint: '/api/security-expert/',
    ragFixed: true,
    ragAlwaysOn: true
  },
  {
    id: 'chat_general',
    apiId: 'llm',
    name: 'Chat General',
    description: 'LLM general con RAG configurable para conversaciones con o sin documentos',
    icon: 'i-heroicons-chat-bubble-left-right',
    color: 'bg-gray-600',
    model: 'DeepSeek-Coder',
    reasoner: 'Modelo de lenguaje general. Único endpoint que permite configurar RAG (use_rag: true/false).',
    endpoint: '/api/chat/',
    ragFixed: false, // RAG configurable
    ragAlwaysOn: false
  }
];

// Language options
const languageOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' }
];

// Conversations sorted by date
const conversations = computed(() => {
  return [...chatStore.conversations].sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
});

// Current conversation and messages
const currentConversation = computed(() => chatStore.currentConversation);
// ✅ SOLUCIÓN DEFINITIVA: Usar directamente el store que ya maneja el ordenamiento correctamente
const currentMessages = computed(() => {
  const messages = chatStore.currentMessages;
  console.log(`[ChatPage] 📨 Recibiendo ${messages.length} mensajes del store en orden:`, messages.map((m, idx) => `${idx}: ${m.role}(ID:${m.id})`));
  
  // ✅ DEBUGGING ADICIONAL REQUERIDO (CLAUDE_DEBUGGING_HISTORY.md)
  console.log('Mensajes para renderizar:', messages.map(m => `${m.id}:${m.role}`));
  
  return messages; // No re-ordenar - confiar en el store
});

// 🚨 ALERTA: Mostrar advertencia sobre conversaciones largas

function showLongConversationAlert(messageCount: number) {
  console.log(`[ChatPage] 🚨 showLongConversationAlert called with ${messageCount} messages`);
  
  if (messageCount <= 4) {
    console.log(`[ChatPage] 🚨 Alert skipped: only ${messageCount} messages`);
    return;
  }
  
  try {
    console.log(`[ChatPage] 🚨 Dispatching global event for LongConversationNotice...`);
    window.dispatchEvent(new CustomEvent('showLongConversationNotice', {
      detail: { messageCount, source: 'chatPage' }
    }));
    
    console.log(`[ChatPage] ✅ Global event dispatched for ${messageCount} messages`);
  } catch (error) {
    console.log(`[ChatPage] ❌ Error dispatching event:`, error);
  }
}

// Manejar el caso cuando chatStore.isTyping no está definido
const isTyping = computed(() => {
  return chatStore && typeof chatStore.isTyping !== 'undefined' ? chatStore.isTyping : false;
});

// 🚨 WATCH: Detectar cuando se superen los 4 mensajes (PERSISTENTE - cada navegación)
watch(() => currentMessages.value.length, (newLength, oldLength) => {
  console.log(`[ChatPage] 👀 Message count changed: ${oldLength} -> ${newLength}`);
  if (newLength > 4) {
    console.log(`[ChatPage] 🎯 Showing persistent alert for ${newLength} messages`);
    nextTick(() => {
      showLongConversationAlert(newLength);
    });
  }
}, { immediate: true });

// RAG service check - IMPORTANTE: Esta propiedad controla la visibilidad de muchos controles en la UI
const isRAGService = computed(() => {
  // Primero, verificar si hay una conversación activa
  if (!currentConversation.value) return false;
  
  // Comprobar los servicios que necesitamos soportar
  const service = currentConversation.value.service;
  
  // NOTA: Consideramos que TODOS los servicios deberían mostrar los controles de configuración
  // para garantizar que la UI sea consistente y evitar problemas de interfaz
  // Los servicios específicos que definitivamente usan RAG son:
  const isExplicitRagService = service === 'rag_conversation' || service === 'security_expert' || 
                              service === 'ai_expert' || service === 'ia_generativa' || 
                              service === 'unified_agent';
  
  // Sin embargo, para cualquier otro servicio, también mostramos los controles para evitar
  // problemas de interfaz y permitir configuración adicional
  console.log(`[isRAGService] Evaluando servicio '${service}': isExplicitRagService=${isExplicitRagService}`);
  
  // Siempre devolver true si hay una conversación activa para garantizar la consistencia de la UI
  return true;
});

// 🚫 Verificar si se ha alcanzado el límite de 20 mensajes
const hasReachedMessageLimit = computed(() => {
  return currentMessages.value.length >= 20;
});

// Edición de título de conversación
const editingTitle = ref(false);
const newTitle = ref('');

// ✅ INSTRUCCIÓN 5: Navigate to specific conversation with message cleanup
function navigateToConversation(id: number) {
  console.log(`[ChatID] Navigating to conversation ${id}`);
  
  // ✅ INSTRUCCIÓN 5: ANTES de navegar, limpiar los mensajes mostrados en UI
  chatStore.clearDisplayedMessages();
  
  // ✅ INSTRUCCIÓN 10: Establecer conversación actual ANTES de navegar
  chatStore.setCurrentConversationId(id);
  
  // ✅ IMPLEMENTAR DEBOUNCE PARA NAVEGACIÓN
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
  }

  navigationTimeout = setTimeout(() => {
    console.log(`[Navigation] Navigating to conversation ${id} after debounce`);
    chatStore.selectConversation(id);
    router.push(`/chat/${id}`);
    navigationTimeout = null;
  }, 100); // 100ms de debounce
}

// Navigation debounce para prevenir múltiples navegaciones rápidas
let navigationTimeout: NodeJS.Timeout | null = null;

// Create new conversation
// Variable de estado para controlar la creación de conversaciones
const isCreatingConversation = ref(false);

// Create new conversation with detailed debugging (SYNCHRONIZED with index.vue)
async function createConversation(serviceId: string, useRag?: boolean) {
  // Evitar múltiples clics/llamadas si ya hay una creación en progreso
  if (isCreatingConversation.value || chatStore.isLoading) {
    console.log(`[Chat] Already creating a conversation, ignoring additional request. isCreatingConversation=${isCreatingConversation.value}, isLoading=${chatStore.isLoading}`);
    return;
  }
  
  const service = mainServices.find(s => s.apiId === serviceId);
  
  console.log(`[Chat] 🔍 CREANDO CONVERSACIÓN DESDE [id].vue:`);
  console.log(`[Chat] → serviceId: ${serviceId}`);
  console.log(`[Chat] → service found:`, service);
  console.log(`[Chat] → endpoint: ${service?.endpoint}`);
  console.log(`[Chat] → RAG fixed: ${service?.ragFixed}`);
  console.log(`[Chat] → useRag param: ${useRag}`);
  
  // Solo asignar use_rag para chat general, los endpoints especializados no lo necesitan
  const finalUseRag = service?.ragAlwaysOn ? undefined : (useRag !== undefined ? useRag : false);
  console.log(`[Chat] → RAG final: ${finalUseRag} (undefined = endpoint no configura RAG)`);
  
  // Activar el semáforo para evitar múltiples creaciones
  isCreatingConversation.value = true;
  console.log(`[Chat] Setting isCreatingConversation=true to prevent duplicate creation`);
  
  try {
    // Guardar el idioma seleccionado en localStorage antes de crear la conversación
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', selectedLanguage.value);
    }
    
    // Iniciar creación con servicio e idioma específicos
    const result = await chatStore.startNewConversation(serviceId, selectedLanguage.value, { use_rag: finalUseRag });
    
    if (result) {
      console.log(`[Chat] ✅ New conversation created with ID: ${result} and language: ${selectedLanguage.value}`);
      
      // DEBUGGING CRÍTICO: Verificar que la conversación se creó con el servicio correcto
      console.log(`[Chat] 🔍 VERIFICANDO CONVERSACIÓN CREADA:`);
      const newConversation = chatStore.conversations.find(c => c.id === result);
      if (newConversation) {
        console.log(`[Chat] → Conversación encontrada: ID=${newConversation.id}, service=${newConversation.service}`);
        console.log(`[Chat] → ragConfig:`, newConversation.ragConfig);
      } else {
        console.error(`[Chat] ❌ No se encontró la conversación recién creada con ID ${result}`);
      }
      
      // Configurar opciones RAG basadas en el servicio seleccionado
      if (serviceId === 'security_expert') {
        ragConfig.value.domain = 'ciberseguridad';
        console.log(`[Chat] Setting domain to ciberseguridad for new conversation`);
      } else if (serviceId === 'ia_generativa' || serviceId === 'ai_expert') {
        ragConfig.value.domain = 'ia_generativa';
        console.log(`[Chat] Setting domain to ia_generativa for new conversation`);
      } else {
        ragConfig.value.domain = 'todos';
        console.log(`[Chat] Setting domain to todos for new conversation`);
      }
      
      // Navegar a la nueva conversación (esto también activará el watcher de route.params.id)
      navigateToConversation(result);
    } else {
      console.error(`[Chat] ❌ Failed to create new conversation with service ${serviceId}`);
    }
  } catch (error) {
    console.error(`[Chat] ❌ Error creating new conversation:`, error);
  } finally {
    // Desactivar semáforo en TODOS los casos (éxito o error)
    isCreatingConversation.value = false;
    console.log(`[Chat] Setting isCreatingConversation=false after completion`);
  }
}

// Delete conversation
async function deleteConversation() {
  const id = Number(route.params.id);
  if (id) {
    await chatStore.removeConversation(id);
    confirmDelete.value = false;
    router.push('/chat');
  }
}

// Format domain name
function formatDomain(domain) {
  if (!domain || domain === 'todos') return 'Todos';
  if (domain === 'ciberseguridad') return 'Ciberseguridad';
  if (domain === 'ia_generativa') return 'IA Generativa';
  return domain;
}

// Variable para almacenar la conversación que se está editando
let conversationToEdit = null;

// Editar título de conversación
function editConversationTitle(conversation) {
  if (!conversation) return;
  editingTitle.value = true;
  newTitle.value = conversation.title || '';
  conversationToEdit = conversation;
}

// Guardar título de conversación
async function saveConversationTitle() {
  if (!editingTitle.value || !newTitle.value.trim() || !conversationToEdit) {
    editingTitle.value = false;
    return;
  }
  
  const title = newTitle.value.trim();
  
  try {
    // Actualizar el título en el store
    if (conversationToEdit.id) {
      await chatStore.updateConversationTitle(conversationToEdit.id, title);
    } else {
      // Actualizar el título en la interfaz inmediatamente
      conversationToEdit.title = title;
    }
    
    // Limpiar
    editingTitle.value = false;
    newTitle.value = '';
    conversationToEdit = null;
  } catch (error) {
    console.error('Error updating conversation title:', error);
  }
}

// RAG toggling functions
function toggleRagUsage() {
  ragConfig.value.use_rag = !ragConfig.value.use_rag;
}

function toggleReasonerUsage() {
  ragConfig.value.use_reasoner = !ragConfig.value.use_reasoner;
}

function openModelModal() {
  showModelModal.value = true;
}

function resetRagConfig() {
  ragConfig.value = {
    use_rag: true,              // Option to activate/deactivate RAG
    use_reasoner: false,        // Option to activate/deactivate reasoner (off by default)
    model: 'deepseek-chat',     // Model to use (deepseek-chat or deepseek-reasoner)
    domain: 'todos',            // Default to search all domains
    similarity_metric: 'cosine', // Use Jina AI embeddings with cosine similarity
    use_mmr: true,              // Enable Maximal Marginal Relevance
    use_rerank: true,           // Enable Cohere Rerank
    min_score: 0.30,            // Umbral inicial de similitud vectorial: 0.30 (≈ cos 72°)
    min_rerank_score: 0.35,     // Umbral de relevancia para Cohere Rerank: 0.35
    top_k: 5,                   // Number of results to retrieve
    model_name: 'jina-embeddings-v3', // Modelo específico de Jina AI
    rerank_model: 'rerank-multilingual-v3.0' // Modelo de Cohere Rerank
  };
}

// Send message with RAG options
/**
 * Función simplificada para enviar mensajes
 */
async function sendMessage() {
  // Verificar condiciones básicas
  const message = inputMessage.value.trim();
  if (!message || isTyping.value || isPollingMessageStatus.value || !currentConversation.value) return;
  
  // 🚫 LÍMITE DE 20 MENSAJES - Bloquear envío si se alcanza el límite
  const messageCount = currentMessages.value.length;
  if (messageCount >= 20) {
    const { $toast } = useNuxtApp();
    $toast.add({
      title: '⛔ Límite de conversación alcanzado',
      description: 'Esta conversación ha alcanzado el límite de 20 mensajes. Por favor, inicia una nueva conversación.',
      color: 'red',
      timeout: 5000
    });
    console.log(`[Chat] 🚫 Envío bloqueado: conversación con ${messageCount} mensajes (límite: 20)`);
    return;
  }
  
  // Reiniciar campo de entrada
  inputMessage.value = '';
  isTyping.value = true;
  
  // Opciones básicas
  const options = {
    language: ragConfig.value.language,
    use_rag: ragConfig.value.use_rag,
    use_reasoner: ragConfig.value.use_reasoner,
    model: ragConfig.value.model,
    llm_temperature: ragConfig.value.llm_temperature
  };
  
  // Añadir opciones de RAG si corresponde
  if (isRAGService.value && ragConfig.value.use_rag) {
    // 🔄 OBTENER DOMINIO CORRECTO SEGÚN CONVERSACIÓN ACTUAL
    const currentDomain = currentConversation.value?.ragConfig?.agent_type === 'ia_generativa' ? 'ia_generativa' :
                         currentConversation.value?.ragConfig?.agent_type === 'security_expert' ? 'ciberseguridad' :
                         ragConfig.value.domain;
    
    Object.assign(options, {
      domain: currentDomain,
      similarity_metric: ragConfig.value.similarity_metric,
      use_mmr: ragConfig.value.use_mmr,
      use_rerank: ragConfig.value.use_rerank,
      min_score: ragConfig.value.min_score,
      min_rerank_score: ragConfig.value.min_rerank_score,
      top_k: ragConfig.value.top_k,
      model_name: ragConfig.value.model_name,
      rerank_model: ragConfig.value.rerank_model
    });
    
    console.log(`[Chat] 🔍 DOMINIO SELECCIONADO:`);
    console.log(`[Chat] → Conversación service: ${currentConversation.value?.service}`);
    console.log(`[Chat] → Conversación agent_type: ${currentConversation.value?.ragConfig?.agent_type}`);
    console.log(`[Chat] → Dominio enviado: ${currentDomain}`);
  }
  
  // Log detallado para depuración
  console.log(`[Chat] Enviando mensaje a conversación ID: ${currentConversation.value.id}, service: ${currentConversation.value.service}`);
  console.log(`[Chat] Configuración completa del mensaje:`, JSON.stringify(options, null, 2));
  
  // Almacenar las opciones en la conversación para futuras referencias
  if (currentConversation.value) {
    // Actualizar o crear el objeto options en la conversación
    currentConversation.value.options = {
      ...currentConversation.value.options || {},
      ...options
    };
    // Guardar en caché para preservar la configuración
    chatStore.saveConversationsToCache();
    console.log(`[Chat] Configuración guardada en la conversación ID: ${currentConversation.value.id}`);
  }
  
  // Capturar tiempo antes de enviar para diagnóstico
  const startTime = Date.now();
  
  // Enviar mensaje
  try {
    const result = await chatStore.sendChatMessage(message, options);
    
    // Calcular tiempo de respuesta para diagnóstico
    const responseTime = Date.now() - startTime;
    console.log(`[Chat] Respuesta recibida en ${responseTime}ms, estado: ${result?.status || 'desconocido'}`);
    
    // Verificar si hay necesidad de polling
    if (result && result.status === 'processing' && result.message_id) {
      console.log(`[Chat] Iniciando polling para mensaje ${result.message_id}`);
      
      // Limpiar cualquier polling previo
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        clearTimeout(pollingInterval.value);
      }
      
      // Iniciar polling
      startPollingMessageStatus(result.message_id);
    } else if (result && result.status === 'completed') {
      // Si la respuesta fue inmediata y completada
      console.log(`[Chat] Mensaje completado inmediatamente, no se requiere polling`);
      isTyping.value = false;
    } else {
      // Si hay otro estado o error
      console.log(`[Chat] Estado de respuesta: ${result?.status || 'desconocido'}`);
      isTyping.value = false;
    }
    
    // Verificar estructura de mensajes en la conversación actual para debugging
    if (currentConversation.value && currentConversation.value.messages.length > 0) {
      const messages = currentConversation.value.messages;
      const lastMsg = messages[messages.length - 1];
      console.log(`[Chat] Último mensaje después de envío: ID=${lastMsg.id}, Role=${lastMsg.role}, Timestamp=${lastMsg._timestamp || lastMsg.created_at || 'no timestamp'}`);
    }
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    isTyping.value = false;
  }
  
  // Scroll al final
  scrollToBottom();
}

/**
 * Función simplificada para el polling de mensajes
 */
function startPollingMessageStatus(messageId) {
  console.log(`[Chat] Iniciando polling para mensaje ${messageId}`);
  isPollingMessageStatus.value = true;
  
  // Limpiar cualquier intervalo existente
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    clearTimeout(pollingInterval.value);
  }
  
  // Config
  let retryCount = 0;
  const maxRetries = 20;
  const baseDelay = 2000;
  
  // Función para obtener el retraso
  const getDelay = (retry) => Math.min(baseDelay * Math.pow(1.2, retry), 10000);
  
  // Función de polling
  const pollStatus = async () => {
    try {
      console.log(`[Chat] Intento ${retryCount + 1} para mensaje ${messageId}`);
      const pollStartTime = Date.now();
      const result = await chatStore.checkMessageStatus(messageId);
      const pollDuration = Date.now() - pollStartTime;
      
      console.log(`[Chat] Consulta de estado completada en ${pollDuration}ms: ${result?.status || 'sin resultado'}`);
      
      // Si no hay resultado
      if (!result) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.warn(`[Chat] Máximo de reintentos (${maxRetries}) alcanzado para mensaje ${messageId}`);
          stopPollingMessageStatus();
          return;
        }
        const nextDelay = getDelay(retryCount);
        console.log(`[Chat] Programando próximo intento en ${nextDelay}ms`);
        setTimeout(pollStatus, nextDelay);
        return;
      }
      
      // Si el mensaje está completo
      if (result.status === 'completed' || result.status === 'error') {
        console.log(`[Chat] Mensaje ${messageId} completado, estado: ${result.status}`);
        
        // Verificar estructura de mensajes para debugging
        if (currentConversation.value && currentConversation.value.messages.length > 0) {
          const messages = currentConversation.value.messages;
          const assistantMsgs = messages.filter(m => m.role === 'assistant');
          if (assistantMsgs.length > 0) {
            const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
            console.log(`[Chat] Último mensaje del asistente: ID=${lastAssistant.id}, Timestamp=${lastAssistant._timestamp || lastAssistant.created_at || 'no timestamp'}`);
          }
        }
        
        stopPollingMessageStatus();
        scrollToBottom();
        return;
      }
      
      // Continuar el polling
      retryCount++;
      if (retryCount >= maxRetries) {
        stopPollingMessageStatus();
        return;
      }
      setTimeout(pollStatus, getDelay(retryCount));
    } catch (error) {
      console.error('[Chat] Error durante polling:', error);
      retryCount++;
      if (retryCount >= maxRetries) {
        stopPollingMessageStatus();
        return;
      }
      setTimeout(pollStatus, getDelay(retryCount) * 1.5);
    }
  };
  
  // Iniciar polling
  pollStatus();
}

/**
 * Función simplificada para detener el polling
 */
function stopPollingMessageStatus() {
  // Limpiar intervalos
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    clearTimeout(pollingInterval.value);
    pollingInterval.value = null;
  }
  
  // Restaurar interfaz
  isPollingMessageStatus.value = false;
  isTyping.value = false;
  console.log('[Chat] Polling detenido');
}

// Handle Enter key
function handleEnterKey(e) {
  if (e.shiftKey) return; // Allow new line with Shift+Enter
  sendMessage();
}

// Copy to clipboard
function copyToClipboard(text) {
  // Remove HTML tags
  const plainText = text.replace(/<[^>]*>/g, '');
  navigator.clipboard.writeText(plainText);
}

// Format dates
function formatDate(date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) {
    return 'Ahora';
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `hace ${minutes}m`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `hace ${hours}h`;
  } else {
    return date.toLocaleDateString();
  }
}

// Format message content
function formatMessageContent(content) {
  if (!content) return '';
  
  // Basic implementation to convert markdown to HTML
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

// Format file size
function formatFileSize(size) {
  if (size < 1024) {
    return `${size} bytes`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Toggle context visibility
function toggleContext(messageId) {
  if (visibleContextIds.value.has(messageId)) {
    visibleContextIds.value.delete(messageId);
  } else {
    visibleContextIds.value.add(messageId);
  }
}

function isContextVisible(messageId) {
  return visibleContextIds.value.has(messageId);
}

// Change language
function changeLanguage() {
  console.log(`[Chat] Cambiando idioma de ${locale.value} a ${selectedLanguage.value}...`);
  
  // Actualizar el idioma de la UI (i18n)
  locale.value = selectedLanguage.value;
  
  // Actualizar también el idioma para las peticiones al backend
  ragConfig.value.language = selectedLanguage.value;
  
  // Guardar en localStorage para persistencia
  if (typeof window !== 'undefined') {
    localStorage.setItem('selectedLanguage', selectedLanguage.value);
    console.log(`[Chat] Idioma actualizado a: ${selectedLanguage.value} (UI y Backend)`);
    
    // Si tenemos una conversación actual, actualizar su idioma
    if (currentConversation.value) {
      currentConversation.value.language = selectedLanguage.value;
      console.log(`[Chat] Actualizado idioma de la conversación ${currentConversation.value.id} a: ${selectedLanguage.value}`);
      
      // Actualizar en caché
      chatStore.saveConversationsToCache();
    }
  }
  
  // Loguear estado de idiomas para diagnóstico
  setTimeout(logLanguageState, 100);
}

// File handling
function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

function handleFileSelected(event) {
  const target = event.target;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
    
    // If no title has been entered, use the file name
    if (!uploadTitle.value) {
      uploadTitle.value = selectedFile.value.name;
    }
  }
}

// Upload document
async function uploadDocument() {
  if (!selectedFile.value || !uploadDomain.value) return;
  
  isUploading.value = true;
  
  try {
    const result = await apiService.uploadDocument(
      selectedFile.value,
      uploadDomain.value,
      uploadTitle.value || undefined
    );
    
    if (result && result.success) {
      // Success message
      await chatStore.addAssistantMessage({
        content: `Documento "${uploadTitle.value || selectedFile.value.name}" procesado correctamente. Se han extraído ${result.chunks || 'varios'} fragmentos para el dominio ${uploadDomain.value}.`
      });
      
      showUploadDocument.value = false;
      selectedFile.value = null;
      uploadTitle.value = '';
      
      // Clear the file input
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    } else {
      console.error('Error uploading document:', result);
      
      await chatStore.addAssistantMessage({
        content: `Error al procesar el documento. Por favor, intenta con otro archivo o contacta al administrador.`
      });
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    
    await chatStore.addAssistantMessage({
      content: `Se produjo un error al intentar procesar el documento. Por favor, inténtalo de nuevo más tarde.`
    });
  } finally {
    isUploading.value = false;
  }
}

// Scroll to bottom of messages
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

// Helpers for service information
function getServiceIcon(serviceId) {
  const service = mainServices.find(s => s.apiId === serviceId);
  return service?.icon || 'i-heroicons-chat-bubble-left-right';
}

function getServiceColor(serviceId) {
  const service = mainServices.find(s => s.apiId === serviceId);
  return service?.color || 'bg-gray-600';
}

function getServiceName(serviceId) {
  if (!serviceId) return '';
  
  const service = mainServices.find(s => s.apiId === serviceId);
  return service?.name || serviceId;
}

// Current conversation info helpers
function getCurrentServiceIcon() {
  return getServiceIcon(currentConversation.value?.service);
}

function getCurrentServiceColor() {
  return getServiceColor(currentConversation.value?.service);
}

function getCurrentServiceName() {
  return getServiceName(currentConversation.value?.service);
}

function getCurrentServiceDescription() {
  const service = mainServices.find(s => s.apiId === currentConversation.value?.service);
  return service?.description || '';
}

function getCurrentServiceReasoner() {
  const service = mainServices.find(s => s.apiId === currentConversation.value?.service);
  return service?.reasoner || '';
}

function getCurrentModelName() {
  if (isRAGService.value) {
    return ragConfig.value.model || 'deepseek-chat';
  }
  return mainServices.find(s => s.apiId === currentConversation.value?.service)?.model || 'DeepSeek-Coder';
}

function getWelcomeMessage() {
  switch(currentConversation.value?.service) {
    case 'security_expert':
      return `<p>¡Hola! Soy tu asistente especializado en ciberseguridad y hacking ético. Mi razonador está entrenado para proporcionar información precisa sobre seguridad informática.</p>
              <p class="mt-2">¿Sobre qué tema de ciberseguridad te gustaría consultar?</p>`;
    case 'ia_generativa':
      return `<p>¡Hola! Soy tu asistente especializado en IA generativa y procesamiento de lenguaje natural. Puedo responder preguntas sobre modelos de lenguaje, transformers, embeddings y otras tecnologías de IA.</p>
              <p class="mt-2">¿Qué te gustaría saber sobre IA generativa?</p>`;
    case 'rag_conversation':
      return `<p>¡Hola! Soy tu asistente RAG (Generación Aumentada por Recuperación) basado en MongoDB. Puedo proporcionarte respuestas precisas basadas en documentos almacenados en nuestra base de conocimiento.</p>
              <p class="mt-2">Puedo ayudarte en temas de ciberseguridad e inteligencia artificial. ¿Qué te gustaría saber?</p>
              <p class="mt-2">Nota: Puedes usar o desactivar las funciones RAG y el razonador desde el panel de configuración.</p>`;
    default:
      return `<p>¡Hola! Soy un asistente de IA basado en DeepSeek-Coder. ¿En qué puedo ayudarte hoy?</p>`;
  }
}

// Auto-scroll when messages or typing state changes
watch(() => [currentMessages.value, isTyping.value, isPollingMessageStatus.value], () => {
  scrollToBottom();
}, { deep: true });

// Control de inicialización para evitar watchers duplicados
const hasInitialized = ref(false);

// ✅ CONTROLAR MÚLTIPLES MONTAJES DE COMPONENTES
let componentMounted = false;

// Watch for route changes with proper control
watch(() => route.params.id, async (newId) => {
  if (newId && hasInitialized.value) {
    console.log(`[Chat][WATCH] Route param id changed to ${newId}, selecting conversation...`);
    
    // Select the conversation based on the route parameter
    chatStore.selectConversation(Number(newId));
    
    // Obtener la conversación seleccionada
    const selectedConv = chatStore.conversations.find(c => c.id === Number(newId));
    
    if (selectedConv) {
      console.log(`[Chat][WATCH] Found conversation ${newId} with service: ${selectedConv.service}`);
      
      // CONFIGURAR TODOS LOS ASPECTOS DE LA UI SEGÚN ESTA CONVERSACIÓN
      
      // 1. Configurar idioma si está disponible
      if (selectedConv.language) {
        console.log(`[Chat][WATCH] Updating language based on conversation ${selectedConv.id}: ${selectedConv.language}`);
        
        // Actualizar UI y backend
        selectedLanguage.value = selectedConv.language;
        locale.value = selectedConv.language;
        ragConfig.value.language = selectedConv.language;
        
        // Guardar en localStorage para usar en futuras sesiones y para la creación de nuevas conversaciones
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedLanguage', selectedConv.language);
          console.log(`[Chat][WATCH] Conversation language saved to localStorage: ${selectedConv.language}`);
        }
      } else {
        console.log(`[Chat][WATCH] Conversation ${newId} has no language defined, using current: ${selectedLanguage.value}`);
        
        // Asignar el idioma actual a la conversación que no tiene idioma definido
        selectedConv.language = selectedLanguage.value;
        chatStore.saveConversationsToCache();
        console.log(`[Chat][WATCH] Assigned language ${selectedLanguage.value} to conversation ${selectedConv.id}`);
      }
      
      // 2. Configurar el servicio y domínio
      // Configurar el dominio basado en el servicio seleccionado
      if (selectedConv.service) {
        console.log(`[Chat][WATCH] Setting service configuration from: ${selectedConv.service}`);
        
        // Establecer el dominio según el servicio
        if (selectedConv.service === 'security_expert') {
          ragConfig.value.domain = 'ciberseguridad';
          console.log(`[Chat][WATCH] Setting domain to ciberseguridad based on service`);
        } else if (selectedConv.service === 'ia_generativa' || selectedConv.service === 'ai_expert') {
          ragConfig.value.domain = 'ia_generativa';
          console.log(`[Chat][WATCH] Setting domain to ia_generativa based on service`);
        }
      }
      
      // 3. Configurar opciones RAG si están disponibles en la conversación
      if (selectedConv.options) {
        console.log(`[Chat][WATCH] Found RAG options in conversation:`, selectedConv.options);
        
        // Actualizar opciones de configuración
        if (typeof selectedConv.options.use_rag !== 'undefined') {
          ragConfig.value.use_rag = selectedConv.options.use_rag;
        }
        if (typeof selectedConv.options.use_reasoner !== 'undefined') {
          ragConfig.value.use_reasoner = selectedConv.options.use_reasoner;
        }
        if (selectedConv.options.domain) {
          ragConfig.value.domain = selectedConv.options.domain;
        }
        if (selectedConv.options.min_score) {
          ragConfig.value.min_score = selectedConv.options.min_score;
        }
        if (selectedConv.options.min_rerank_score) {
          ragConfig.value.min_rerank_score = selectedConv.options.min_rerank_score;
        }
      } else {
        console.log(`[Chat][WATCH] No RAG options found in conversation, using defaults`);
      }
    } else {
      console.warn(`[Chat][WATCH] Could not find conversation with ID ${newId} in loaded conversations`);
    }
  }
}, { immediate: true });

// ✅ CRÍTICO: NO llamar initSession - solo refresh conversations
async function refreshConversations() {
  console.log('[Chat] Refreshing conversations with existing session...');
  try {
    // ✅ NO inicializar sesión - usar la existente
    console.log('[Chat] Using existing session token for refresh');
    
    // Recargar conversaciones con el token existente
    await chatStore.loadConversations(true);
    
    // If current conversation is missing after reload, navigate to /chat
    if (route.params.id && !chatStore.conversations.some(c => c.id === Number(route.params.id))) {
      console.warn(`[Chat] Current conversation ${route.params.id} no longer exists after refresh`);
      router.push('/chat');
    }
    // Otherwise make sure the current conversation is selected
    else if (route.params.id) {
      chatStore.selectConversation(Number(route.params.id));
      console.log(`[Chat] Reselected conversation ${route.params.id} after refresh`);
    }
  } catch (error) {
    console.error('[Chat] Error refreshing conversations:', error);
  }
}

// Clean up intervals before unmounting
onBeforeUnmount(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
});

// Función para loguear y diagnosticar el estado del idioma
function logLanguageState() {
  console.log('\n[Chat] === LANGUAGE STATE DIAGNOSTICS ===');
  console.log(`UI Language (locale): ${locale.value}`);
  console.log(`Selected Language: ${selectedLanguage.value}`);
  console.log(`RAG Config Language: ${ragConfig.value.language}`);
  
  if (currentConversation.value) {
    console.log(`Current Conversation Language: ${currentConversation.value.language || 'not set'}`);
  } else {
    console.log('No current conversation selected');
  }
  
  // Check localStorage
  if (typeof window !== 'undefined') {
    console.log(`localStorage selectedLanguage: ${localStorage.getItem('selectedLanguage') || 'not set'}`);
    console.log(`localStorage nuxt-locale: ${localStorage.getItem('nuxt-locale') || 'not set'}`);
  }
  console.log('[Chat] === END DIAGNOSTICS ===\n');
}

// Variable para almacenar el ID de conversación que se debe seleccionar una vez que las conversaciones se carguen
const pendingConversationId = ref<number | null>(null);

// Watch para detectar cuando las conversaciones se han cargado completamente
watch(() => chatStore.conversationsLoaded, async (loaded) => {
  console.log(`[CHAT PAGE WATCH] conversationsLoaded cambió a: ${loaded}, pendingConversationId=${pendingConversationId.value}`);
  
  if (loaded && pendingConversationId.value && !hasInitialized.value) {
    console.log(`[CHAT PAGE WATCH] conversationsLoaded es true Y pendingConversationId es ${pendingConversationId.value}. Intentando seleccionar...`);
    
    // Usar nextTick para evitar problemas de reactividad
    await nextTick();
    
    selectAndConfigureConversation(pendingConversationId.value);
    
    // Limpiar el ID pendiente después de seleccionarlo para evitar reselecciones innecesarias
    const oldId = pendingConversationId.value;
    pendingConversationId.value = null;
    hasInitialized.value = true;
    console.log(`[CHAT PAGE WATCH] Selección completada para ID ${oldId}, pendingConversationId limpiado a null`);
  } else if (loaded) {
    console.log(`[CHAT PAGE WATCH] conversationsLoaded es true pero no hay pendingConversationId.`);
  }
}, { immediate: true });

// Función para seleccionar y configurar una conversación
function selectAndConfigureConversation(conversationId: number) {
  console.log(`[SELECT_CONVO] Iniciando selección para ID: ${conversationId}`);
  console.log(`[SELECT_CONVO] Estado actual - conversationsLoaded: ${chatStore.conversationsLoaded}, total conversaciones: ${chatStore.conversations.length}`);
  console.log(`[SELECT_CONVO] Conversaciones disponibles: ${JSON.stringify(chatStore.conversations.map(c => ({id: c.id, service: c.service})))}`);
  
  // Buscar la conversación en la lista cargada
  const selectedConv = chatStore.conversations.find(c => c.id === conversationId);
  
  if (selectedConv) {
    // Registrar el objeto completo de la conversación para diagnóstico
    console.log(`[SELECT_CONVO] Objeto completo de la conversación seleccionada:`, selectedConv);
    
    console.log(`[SELECT_CONVO] Conversación ENCONTRADA:`, {
      id: selectedConv.id,
      service: selectedConv.service,
      language: selectedConv.language,
      messageCount: selectedConv.messages?.length || 0,
      hasOptions: !!selectedConv.options
    });
    
    // Establecer como conversación activa
    chatStore.selectConversation(conversationId);
    
    // CONFIGURAR TODOS LOS ASPECTOS DE LA UI SEGÚN ESTA CONVERSACIÓN
    
    // 1. Configurar idioma si está disponible
    if (selectedConv.language) {
      console.log(`[Chat][SELECT] Updating language based on conversation ${selectedConv.id}: ${selectedConv.language}`);
      
      // Actualizar UI y backend
      selectedLanguage.value = selectedConv.language;
      locale.value = selectedConv.language;
      ragConfig.value.language = selectedConv.language;
      
      // Guardar en localStorage para usar en futuras sesiones y para la creación de nuevas conversaciones
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedLanguage', selectedConv.language);
        console.log(`[Chat][SELECT] Conversation language saved to localStorage: ${selectedConv.language}`);
      }
    } else {
      console.log(`[Chat][SELECT] Conversation ${conversationId} has no language defined, using current: ${selectedLanguage.value}`);
      
      // Asignar el idioma actual a la conversación que no tiene idioma definido
      selectedConv.language = selectedLanguage.value;
      chatStore.saveConversationsToCache();
      console.log(`[Chat][SELECT] Assigned language ${selectedLanguage.value} to conversation ${selectedConv.id}`);
    }
    
    // 2. Configurar el servicio y dominio
    // Configurar el dominio basado en el servicio seleccionado
    if (selectedConv.service) {
      console.log(`[Chat][SELECT] Setting service configuration from: ${selectedConv.service}`);
      
      // Establecer el dominio según el servicio
      if (selectedConv.service === 'security_expert') {
        ragConfig.value.domain = 'ciberseguridad';
        console.log(`[Chat][SELECT] Setting domain to ciberseguridad based on service`);
      } else if (selectedConv.service === 'ia_generativa' || selectedConv.service === 'ai_expert') {
        ragConfig.value.domain = 'ia_generativa';
        console.log(`[Chat][SELECT] Setting domain to ia_generativa based on service`);
      } else if (selectedConv.service === 'rag_conversation') {
        // Para RAG, podríamos mantener el dominio existente o establecer 'todos'
        if (!['ciberseguridad', 'ia_generativa'].includes(ragConfig.value.domain)) {
          ragConfig.value.domain = 'todos';
        }
        console.log(`[Chat][SELECT] RAG service detected, domain set to: ${ragConfig.value.domain}`);
      }
    }
    
    // 3. Configurar opciones RAG si están disponibles en la conversación
    if (selectedConv.options) {
      console.log(`[Chat][SELECT] Found RAG options in conversation:`, selectedConv.options);
      
      // Actualizar TODAS las opciones de configuración posibles
      // Uso de RAG
      if (typeof selectedConv.options.use_rag !== 'undefined') {
        ragConfig.value.use_rag = selectedConv.options.use_rag;
        console.log(`[Chat][SELECT] Setting use_rag=${ragConfig.value.use_rag}`);
      }
      
      // Uso de razonador
      if (typeof selectedConv.options.use_reasoner !== 'undefined') {
        ragConfig.value.use_reasoner = selectedConv.options.use_reasoner;
        console.log(`[Chat][SELECT] Setting use_reasoner=${ragConfig.value.use_reasoner}`);
      } else if (typeof selectedConv.options.use_deepseek_reasoning !== 'undefined') {
        // Compatibilidad con nombres anteriores del campo
        ragConfig.value.use_reasoner = selectedConv.options.use_deepseek_reasoning;
        console.log(`[Chat][SELECT] Setting use_reasoner=${ragConfig.value.use_reasoner} (from use_deepseek_reasoning)`);
      }
      
      // Dominio de conocimiento
      if (selectedConv.options.domain) {
        ragConfig.value.domain = selectedConv.options.domain;
        console.log(`[Chat][SELECT] Setting domain=${ragConfig.value.domain}`);
      }
      
      // Configuración de similitud y puntuaciones
      if (typeof selectedConv.options.min_score !== 'undefined') {
        ragConfig.value.min_score = selectedConv.options.min_score;
        console.log(`[Chat][SELECT] Setting min_score=${ragConfig.value.min_score}`);
      }
      
      if (typeof selectedConv.options.min_rerank_score !== 'undefined') {
        ragConfig.value.min_rerank_score = selectedConv.options.min_rerank_score;
        console.log(`[Chat][SELECT] Setting min_rerank_score=${ragConfig.value.min_rerank_score}`);
      }
      
      // Modelo LLM
      if (selectedConv.options.model) {
        ragConfig.value.model = selectedConv.options.model;
        console.log(`[Chat][SELECT] Setting model=${ragConfig.value.model}`);
      }
      
      // Métricas de similitud
      if (selectedConv.options.similarity_metric) {
        ragConfig.value.similarity_metric = selectedConv.options.similarity_metric;
        console.log(`[Chat][SELECT] Setting similarity_metric=${ragConfig.value.similarity_metric}`);
      }
      
      // Uso de reranking
      if (typeof selectedConv.options.use_rerank !== 'undefined') {
        ragConfig.value.use_rerank = selectedConv.options.use_rerank;
        console.log(`[Chat][SELECT] Setting use_rerank=${ragConfig.value.use_rerank}`);
      }
      
      // Uso de MMR
      if (typeof selectedConv.options.use_mmr !== 'undefined') {
        ragConfig.value.use_mmr = selectedConv.options.use_mmr;
        console.log(`[Chat][SELECT] Setting use_mmr=${ragConfig.value.use_mmr}`);
      }
      
      // Top-K para búsqueda
      if (typeof selectedConv.options.top_k !== 'undefined') {
        ragConfig.value.top_k = selectedConv.options.top_k;
        console.log(`[Chat][SELECT] Setting top_k=${ragConfig.value.top_k}`);
      }
      
      // Temperatura de LLM
      if (typeof selectedConv.options.llm_temperature !== 'undefined') {
        ragConfig.value.llm_temperature = selectedConv.options.llm_temperature;
        console.log(`[Chat][SELECT] Setting llm_temperature=${ragConfig.value.llm_temperature}`);
      }
    } else {
      console.log(`[Chat][SELECT] No RAG options found in conversation, using defaults for this service`);
      // Podríamos establecer valores predeterminados específicos para el servicio aquí si es necesario
    }
    
    // Log complete configuration after all updates
    console.log(`[SELECT_CONVO] Configuración UI actualizada para reflejar convo: ${conversationId}, con servicio: ${selectedConv.service}, y configuración final:`, {
      use_rag: ragConfig.value.use_rag,
      use_reasoner: ragConfig.value.use_reasoner,
      model: ragConfig.value.model,
      domain: ragConfig.value.domain,
      language: ragConfig.value.language,
      similarity_metric: ragConfig.value.similarity_metric,
      min_score: ragConfig.value.min_score,
      min_rerank_score: ragConfig.value.min_rerank_score,
      use_rerank: ragConfig.value.use_rerank,
      use_mmr: ragConfig.value.use_mmr,
      top_k: ragConfig.value.top_k
    });
    
    // Log language state after everything is configured
    logLanguageState();
  } else {
    console.warn(`[SELECT_CONVO] ERROR: Conversación con ID ${conversationId} NO encontrada en la lista cargada del store.`);
    console.warn(`[SELECT_CONVO] La lista actual es:`, chatStore.conversations.map(c => ({id: c.id, service: c.service})));
    
    // Manejar el caso de conversación no encontrada
    // Si hay otras conversaciones disponibles, seleccionar la primera
    if (chatStore.conversations.length > 0) {
      console.log(`[SELECT_CONVO] Seleccionando la primera conversación disponible como fallback`);
      const firstConversation = chatStore.conversations[0];
      router.push(`/chat/${firstConversation.id}`);
    } else {
      console.log(`[SELECT_CONVO] No hay conversaciones disponibles, redirigiendo a /chat`);
      router.push('/chat');
    }
  }
}

// ✅ CRÍTICO: NO inicializar sesión aquí - usar la del app.vue
async function initializeChat() {
  console.log('[Chat] Initializing chat with existing session...');
  
  // ✅ Solo verificar que hay token - NO crear nuevo
  const session = useSession();
  if (!session.token) {
    console.log('[Chat] No session token in store, trying localStorage...');
    
    // Intentar cargar desde localStorage
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('userSessionToken') : null;
    if (storedToken) {
      console.log('[Chat] Using stored token:', storedToken.substring(0, 8) + '...');
      session.setToken(storedToken);
      session.isSessionInitialized = true;
    } else {
      console.error('[Chat] No session token available');
      return false;
    }
  }
  
  // 2. Cargar conversaciones (solo si no están cargadas)
  if (!chatStore.conversationsLoaded) {
    console.log('[Chat] Loading conversations...');
    await chatStore.loadConversations();
  }
  
  // 3. Seleccionar conversación específica si hay ID en la ruta
  const routeId = route.params.id ? Number(route.params.id) : null;
  if (routeId && chatStore.conversationsLoaded) {
    console.log(`[Chat] Selecting conversation ${routeId}...`);
    await chatStore.selectConversation(routeId);
  }
  
  hasInitialized.value = true;
  console.log('[Chat] Chat initialization completed');
  return true;
}

onMounted(async () => {
  // ✅ CONTROLAR MÚLTIPLES MONTAJES
  if (componentMounted) {
    console.log('[Chat] Component already mounted, skipping initialization');
    return;
  }
  componentMounted = true;
  
  console.log('[Chat] Page mounted, initializing chat...');
  
  // ✅ INSTRUCCIÓN 7: INMEDIATAMENTE establecer conversationId del route
  const routeId = route.params.id ? Number(route.params.id) : null;
  if (routeId && typeof routeId === 'number' && routeId > 0) {
    console.log(`[Chat] Setting current conversation ID to ${routeId} from route params`);
    chatStore.setCurrentConversationId(routeId);
  }
  
  await initializeChat();
  
  // Look for the file input after rendering
  nextTick(() => {
    fileInput.value = document.querySelector('input[type="file"]');
    scrollToBottom();
  });
});

onBeforeUnmount(() => {
  componentMounted = false;
  
  // Limpiar timeouts
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
    navigationTimeout = null;
  }
  
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
});

// ✅ INSTRUCCIÓN 8: Watch para cambios en la ruta con verificación de currentConversationId
watch(() => route.params.id, async (newId) => {
  if (!newId) return;
  
  // ✅ INSTRUCCIÓN 8: ANTES de procesar mensajes: verificar currentConversationId
  if (!currentConversationId.value) {
    console.log(`[CHAT PAGE WATCH] No currentConversationId set, skipping route watch`);
    return;
  }
  
  const conversationId = Number(newId);
  console.log(`[FILTER] Processing messages for conversation ${conversationId}`);
  console.log(`[CHAT PAGE WATCH] Route param id changed to ${conversationId}, checking if conversations are loaded...`);
  console.log(`[CHAT PAGE WATCH] Estado actual - conversationsLoaded=${chatStore.conversationsLoaded}, isLoading=${chatStore.isLoading}, conversations.length=${chatStore.conversations.length}`);
  
  // Verificar si las conversaciones ya se han cargado
  if (!chatStore.conversationsLoaded) {
    console.log(`[CHAT PAGE WATCH] Conversations not yet loaded, marking ID ${conversationId} as pending selection`);
    pendingConversationId.value = conversationId;
    
    // Si las conversaciones no están cargadas, asegúrate de iniciar la carga
    if (!chatStore.isLoading) {
      console.log(`[CHAT PAGE WATCH] Initiating conversation loading...`);
      chatStore.loadConversations().then((success) => {
        console.log(`[CHAT PAGE WATCH] Conversations loading completed, success=${success}, loaded=${chatStore.conversationsLoaded}, count=${chatStore.conversations.length}`);
        
        // Verificación adicional si el flag no se estableció por alguna razón
        if (success && !chatStore.conversationsLoaded && chatStore.conversations.length > 0) {
          console.log(`[CHAT PAGE WATCH] Forzando conversationsLoaded=true porque tenemos conversaciones cargadas`); 
          chatStore.conversationsLoaded = true;
        }
        
        // Si aún tenemos un ID pendiente, seleccionarlo
        if (pendingConversationId.value) {
          console.log(`[CHAT PAGE WATCH] Seleccionando ID pendiente: ${pendingConversationId.value} después de cargar`);
          selectAndConfigureConversation(pendingConversationId.value);
          pendingConversationId.value = null;
        }
      });
    }
  } else {
    // Las conversaciones ya están cargadas, seleccionar inmediatamente
    console.log(`[CHAT PAGE WATCH] Conversations already loaded, selecting now`);
    selectAndConfigureConversation(conversationId);
  }
}, { immediate: false }); // No immediate porque ya manejamos el valor inicial en onMounted

// Función para configurar la interfaz de usuario según la conversación seleccionada
function updateDomainBasedOnService() {
  if (!currentConversation.value) return;
  
  console.log(`[Chat] Configurando UI para conversación ID: ${currentConversation.value.id}`);
  
  // 1. PRIMERA PRIORIDAD: Si la conversación tiene opciones guardadas, usarlas
  if (currentConversation.value.options) {
    console.log(`[Chat] Encontradas opciones guardadas en la conversación:`, currentConversation.value.options);
    
    // Actualizar configuración RAG con las opciones guardadas
    const savedOptions = currentConversation.value.options;
    
    // Transferir cada opción a la configuración de la UI si existe
    if (typeof savedOptions.use_rag !== 'undefined') ragConfig.value.use_rag = savedOptions.use_rag;
    if (typeof savedOptions.use_reasoner !== 'undefined') ragConfig.value.use_reasoner = savedOptions.use_reasoner;
    if (savedOptions.domain) ragConfig.value.domain = savedOptions.domain;
    if (savedOptions.min_score) ragConfig.value.min_score = savedOptions.min_score;
    if (savedOptions.min_rerank_score) ragConfig.value.min_rerank_score = savedOptions.min_rerank_score;
    if (savedOptions.top_k) ragConfig.value.top_k = savedOptions.top_k;
    if (savedOptions.model) ragConfig.value.model = savedOptions.model;
    
    console.log(`[Chat] Configuración UI actualizada desde opciones guardadas de la conversación`);
    return; // No necesitamos hacer más configuración
  }
  
  // 2. SEGUNDA PRIORIDAD: Configurar basado en el servicio
  const service = currentConversation.value.service;
  console.log(`[Chat] Configurando dominio según servicio: ${service}`);
  
  // Guardar el dominio actual para comparar después
  const currentDomain = ragConfig.value.domain;
  
  // Establecer el dominio según el servicio
  let newDomain = currentDomain;
  
  if (service === 'security_expert') {
    newDomain = 'ciberseguridad';
  } else if (service === 'ia_generativa' || service === 'ai_expert') {
    newDomain = 'ia_generativa';
  } else if (service === 'rag_conversation') {
    // Para RAG conversation, mantener el dominio actual o usar 'todos' si no está configurado para los dominios específicos
    if (currentDomain !== 'ciberseguridad' && currentDomain !== 'ia_generativa') {
      newDomain = 'todos';
    }
  } else {
    newDomain = 'todos';
  }
  
  // Solo actualizar si el dominio ha cambiado
  if (newDomain !== currentDomain) {
    console.log(`[Chat] Dominio actualizado: ${currentDomain} -> ${newDomain}`);
    ragConfig.value.domain = newDomain;
  } else {
    console.log(`[Chat] Dominio mantenido: ${currentDomain}`);
  }
  
  // Guardar la configuración en la conversación para futuras referencias
  currentConversation.value.options = {
    use_rag: ragConfig.value.use_rag,
    use_reasoner: ragConfig.value.use_reasoner,
    domain: ragConfig.value.domain,
    min_score: ragConfig.value.min_score,
    min_rerank_score: ragConfig.value.min_rerank_score,
    top_k: ragConfig.value.top_k,
    model: ragConfig.value.model
  };
  
  // Guardar en caché
  chatStore.saveConversationsToCache();
  console.log(`[Chat] Configuración guardada en la conversación ID: ${currentConversation.value.id}`);
}

// Escuchar cambios en la conversación actual y su servicio para actualizar el dominio
watch(() => currentConversation.value, (newConversation) => {
  if (newConversation) {
    console.log('[Chat] Conversación actualizada, verificando dominio...');
    updateDomainBasedOnService();
  }
}, { deep: true, immediate: true });

// También escuchar específicamente cambios en el servicio
watch(() => currentConversation.value?.service, (newService) => {
  if (newService) {
    console.log(`[Chat] Servicio actualizado a: ${newService}, reconfigurando dominio...`);
    updateDomainBasedOnService();
  }
});
</script>

<style scoped>
/* Typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  margin: 0 2px;
  background-color: #999;
  border-radius: 50%;
  display: inline-block;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 80%, 100% { 
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}
</style>