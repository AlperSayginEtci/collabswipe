import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/client'
import superjson from 'superjson'
import { routeTree } from './routeTree.gen'
import { trpc } from '@/lib/trpc'
import './index.css'

if (typeof window !== 'undefined') {
  window.addEventListener('error', function(e) {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      const fallbackUrl = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024';
      if (img.src !== fallbackUrl) {
        img.src = fallbackUrl;
      }
    }
  }, true);
}

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const [queryClient] = useState(() => new QueryClient())
  
  // Get API URL from env, or default to localhost. Remove trailing slash if exists.
  let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('192.168.')) {
      apiUrl = window.location.origin;
    }
  }
  if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
  
  // Vercel does not support WebSockets. Point WS directly to Railway in production!
  let wsUrl = apiUrl.replace(/^http/, 'ws');
  if (typeof window !== 'undefined' && window.location.hostname === 'collabswipe-web.vercel.app') {
    wsUrl = 'wss://collabswipe-production.up.railway.app';
  }

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: wsLink({
            client: createWSClient({
              url: `${wsUrl}/api/trpc`,
            }),
          }),
          false: httpBatchLink({
            url: `${apiUrl}/api/trpc`,
            fetch: (url, options) => {
              return fetch(url, {
                ...options,
                credentials: 'include',
              })
            },
          }),
        }),
      ],
      transformer: superjson,
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  )
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
