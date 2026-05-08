import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@collabswipe/api/src/root';

export const trpc = createTRPCReact<AppRouter>();
