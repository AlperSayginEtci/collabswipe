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
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: wsLink({
            client: createWSClient({
              url: 'ws://localhost:3001/api/trpc',
            }),
          }),
          false: httpBatchLink({
            url: 'http://localhost:3001/api/trpc',
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
