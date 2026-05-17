import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@collabswipe/api/src/root';
import Constants from 'expo-constants';
import { getBaseUrl } from '../app/_layout';

export const trpc = createTRPCReact<AppRouter>();

export function getTrpcClient() {
  const baseUrl = getBaseUrl();
  const wsUrl = baseUrl.replace(/^http/, 'ws');
  
  return trpc.createClient({
    links: [
      splitLink({
        condition: (op) => op.type === 'subscription',
        true: wsLink({
          client: createWSClient({
            url: `${wsUrl}/api/trpc`,
          }),
        }),
        false: httpBatchLink({
          url: `${baseUrl}/api/trpc`,
        }),
      }),
    ],
    transformer: superjson,
  });
}
