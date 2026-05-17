# CollabSwipe Realtime Messaging Architecture Plan

This document outlines the architecture, data models, and implementation strategy for adding a production-grade realtime messaging system to CollabSwipe, strictly following the existing Turborepo + tRPC + React/React Native stack.

## User Review Required

> [!IMPORTANT]  
> **WebSocket Strategy:** We will introduce WebSocket connections (`ws` package) alongside the existing Express HTTP server. The tRPC client will use a `splitLink` to route subscriptions over WS and queries/mutations over HTTP. Is this acceptable?
> 
> **Pub/Sub Mechanism:** For the initial implementation, I will use a simple Node.js `EventEmitter` for pub/sub (which works perfectly for a single-server instance). For true horizontal scalability (multiple server containers), you will eventually need Redis Pub/Sub. Do you want to stick with the `EventEmitter` for this sprint?

## Proposed Changes

### Database Schema Updates (`packages/db`)

We will update the existing chat models in `packages/db/prisma/schema.prisma` to support read receipts, conversation sorting, and soft deletes.

#### [MODIFY] `packages/db/prisma/schema.prisma`
```prisma
model Conversation {
  id            String   @id @default(cuid())
  isGroup       Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt // Added: For sorting by latest activity
  lastMessageAt DateTime @default(now()) // Added: Explicit sorting field for performance

  participants Participant[]
  messages     Message[]
}

model Participant {
  conversationId String
  userId         String
  lastReadAt     DateTime? // Added: For unread message calculation

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([conversationId, userId])
}
```

---

### Backend / API Layer (`packages/api` & `apps/server`)

#### [MODIFY] `apps/server/src/index.ts`
- Install `ws` package.
- Create an HTTP server instance from the Express app.
- Attach `@trpc/server/adapters/ws` (`applyWSSHandler`) to the HTTP server for WebSocket upgrades.
- Ensure CORS and session validation is handled properly on WebSocket upgrade.

#### [NEW] `packages/api/src/routers/chat.ts`
- **Queries:**
  - `getConversations`: Fetches paginated conversations sorted by `lastMessageAt`. Includes `unreadCount` calculation and `lastMessage` preview.
  - `getMessages`: Fetches paginated messages for a conversation (infinite scroll).
- **Mutations:**
  - `sendMessage`: Inserts a message, updates `Conversation.lastMessageAt`, and emits an event to the pub/sub instance.
  - `markAsRead`: Updates `Participant.lastReadAt`.
  - `typing`: Emits a typing event to the pub/sub instance.
- **Subscriptions (Realtime):**
  - `onMessage`: Listens for new messages in user's conversations.
  - `onTyping`: Listens for typing indicators.

#### [NEW] `packages/api/src/events.ts`
- Global type-safe `EventEmitter` singleton to handle pub/sub routing between mutations and subscriptions.

---

### Frontend / Mobile Integration (`apps/mobile`)

#### [MODIFY] `apps/mobile/lib/trpc.ts` & `_layout.tsx`
- Install `@trpc/client` WebSocket dependencies.
- Update `trpcClient` initialization to use `splitLink`:
  - `httpBatchLink` for standard queries and mutations.
  - `wsLink` for subscriptions (`onMessage`, `onTyping`).

#### [NEW] `apps/mobile/hooks/useChat.ts`
- A custom hook wrapping tRPC logic to handle:
  - Optimistic UI updates (appending messages immediately before server confirmation).
  - Rollback on failure.
  - Cache invalidation and realtime cache synchronization when a subscription event is received.

#### [NEW] `apps/mobile/app/(tabs)/matches.tsx` (Update)
- Update the Matches screen to fetch conversations via `trpc.chat.getConversations.useInfiniteQuery`.
- Render unread badges and `lastMessage` previews.

#### [NEW] `apps/mobile/app/chat/[id].tsx`
- The actual one-to-one chat screen.
- Implements `FlatList` with `inverted` for infinite scrolling of history.
- Renders `MessageBubble` components.
- Handles typing state and read receipts.

## Event Flows & Architecture

1. **Connection**: Client establishes a WS connection. The tRPC `createContext` reads the Better Auth session token to authorize the socket.
2. **Sending a Message**: 
   - Client calls `sendMessage` (Mutation via HTTP).
   - Server writes to Postgres.
   - Server emits `new_message` event via `EventEmitter`.
   - The WS Subscription `onMessage` (listening for this user's ID) picks it up and sends the message down the socket to the receiver.
3. **Optimistic UI**: When the sender hits "Send", React Query (`onMutate`) instantly appends the message to the local cache. If the server fails, it rolls back.

## Migration Strategy

1. Run `pnpm --filter @collabswipe/db prisma format` and `db:push` to update the schema safely (or `prisma migrate dev` if migrations are tracked).
2. Generate the new Prisma client.
3. Restart `pnpm dev` to initialize the WebSocket server.

## Verification Plan

### Automated/Manual Tests
- **WebSocket Connection**: Verify the mobile client successfully upgrades to WS on port 3001.
- **Realtime Delivery**: Open two instances (or two logged-in accounts) and verify messages appear instantly without refreshing.
- **Unread Counts**: Verify that sending a message increments the unread counter on the receiver's end, and entering the chat resets it.
- **Pagination**: Scroll up in a chat to trigger `fetchNextPage` and load older messages.
