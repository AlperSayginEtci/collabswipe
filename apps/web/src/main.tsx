import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/client'
import superjson from 'superjson'
import { routeTree } from './routeTree.gen'
import { trpc } from '@/lib/trpc'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const [queryClient] = useState(() => new QueryClient())
  
  // Get API URL from env, or default to localhost. Remove trailing slash if exists.
  let apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';
  if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
  
  const wsUrl = apiUrl.replace(/^http/, 'ws');

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
