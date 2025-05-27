# Dynamic Routing in Nuxt 3

This document explains how dynamic routing is implemented in this Nuxt 3 project, specifically for the chat feature.

## How Dynamic Routes Work in Nuxt 3

Nuxt 3 uses file-based routing, where dynamic routes are created using square brackets in the filename:

- `pages/chat/[id].vue` creates a route that matches `/chat/123`, `/chat/456`, etc.
- The dynamic parameter (`id`) is accessible through the `useRoute()` composable:
  ```js
  const route = useRoute()
  const id = route.params.id
  ```

## Implementation Details

### 1. Files Created/Modified

- **New Files:**
  - `/pages/chat/[id].vue` - Dynamic route for individual conversations
  - `/pages/chat/index.vue` - Main chat page (landing page)
  - `/middleware/chat.global.ts` - Middleware for redirecting old routes

- **Modified Files:**
  - `/components/global/navBar.vue` - Updated navigation links

### 2. Key Features

#### Dynamic Conversation Loading
When navigating to `/chat/[id]`, the page loads the specific conversation:

```js
// Load the specific conversation based on the route parameter
async function loadConversationFromRoute() {
  const conversationId = parseInt(route.params.id as string);
  
  // First load all conversations if they're not already loaded
  if (conversations.value.length === 0) {
    await loadConversations();
  }
  
  // Then select the specific conversation
  if (conversationId && !isNaN(conversationId)) {
    const exists = conversations.value.some(conv => conv.id === conversationId);
    
    if (exists) {
      selectConversation(conversationId);
    } else {
      // If conversation doesn't exist, redirect to main chat page
      router.push('/chat');
    }
  }
}
```

#### Route Parameter Watching
The code watches for route changes to load the correct conversation:

```js
// Watch for route changes to load the correct conversation
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await loadConversationFromRoute();
  }
}, { immediate: true });
```

#### Navigation Between Conversations
When selecting a conversation from the sidebar or creating a new one:

```js
// When creating a new conversation
async function handleServiceSelect(serviceId: string) {
  showServiceSelector.value = false;
  const conversationId = await startNewConversation(serviceId);
  if (conversationId) {
    // Navigate to the new conversation
    router.push(`/chat/${conversationId}`);
  }
}

// When selecting from sidebar
function navigateToConversation(id: number) {
  router.push(`/chat/${id}`);
}
```

### 3. Benefits of This Approach

1. **Direct Linking:** Users can directly link to specific conversations via URL
2. **Browser History:** Each conversation gets its own history entry for better navigation
3. **Separation of Concerns:** Each page component has its own clear responsibility
4. **SEO Friendly:** Each conversation can have its own metadata for better SEO
5. **Cleaner Code:** Logic is separated between listing and detail views

## Usage

- Visit `/chat` to see the list of conversations and start a new one
- Each conversation will have its own URL at `/chat/[id]`
- If a conversation is deleted or doesn't exist, the user is redirected to `/chat`

## Future Enhancements

Potential improvements to this routing system:

1. Add title-based slugs for better URLs (e.g., `/chat/123-discussion-about-ai`)
2. Implement prefetching for faster navigation between conversations
3. Add metadata for better SEO and sharing capabilities