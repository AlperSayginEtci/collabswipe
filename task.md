# Realtime Messaging System Implementation

- [x] Update `packages/db/prisma/schema.prisma` with `updatedAt`, `lastMessageAt`, and `lastReadAt`.
- [x] Run `db:push` to apply schema changes and generate Prisma client. (Needs server restart)
- [x] Install `ws` and `@types/ws` in `apps/server`.
- [x] Implement `packages/api/src/events.ts` (EventEmitter singleton).
- [x] Implement `packages/api/src/routers/chat.ts` (tRPC router for queries, mutations, subscriptions).
- [x] Update `packages/api/src/root.ts` to include `chatRouter`.
- [x] Update `apps/server/src/index.ts` to attach WebSocket server (`applyWSSHandler`).
- [x] Update `apps/mobile/lib/trpc.ts` and `_layout.tsx` to configure `wsLink` and `splitLink`.
- [x] Implement `apps/mobile/app/(tabs)/matches.tsx` UI updates (unread counts).
- [x] Implement `apps/mobile/app/chat/index.tsx` (Infinite scroll, optimistic UI, presence).
- [x] Implement `apps/web/src/routes/matches.tsx` (Web Chat UI).
- [x] Test the implementation.
