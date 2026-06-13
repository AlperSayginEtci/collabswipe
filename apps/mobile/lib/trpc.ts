import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@collabswipe/api/src/root';
import Constants from 'expo-constants';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getBaseUrl = () => {
  // Use computer's local IP (192.168.1.39) which is universally accessible on the same Wi-Fi network
  // for both physical devices (Android/iOS) and emulators.
  return 'http://192.168.1.39:3001';
};

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
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              credentials: 'include',
            });
          },
          async headers() {
            const token = await AsyncStorage.getItem('@collabswipe_session_token');
            console.log("[tRPC Client headers] Loaded token from storage:", token ? `${token.substring(0, 10)}...` : "null");
            return token ? {
              Authorization: `Bearer ${token}`
            } : {};
          }
        }),
      }),
    ],
    transformer: superjson,
  });
}
