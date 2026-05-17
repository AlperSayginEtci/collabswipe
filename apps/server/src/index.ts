import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter, createTRPCContext } from '@collabswipe/api';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@collabswipe/auth';

dotenv.config();


const app = express();
const port = process.env.PORT || 3001;

// Trigger server reload to pick up updated tRPC login & register routes in packages/api - trigger 2

// Better Auth requires proper CORS with credentials: true to share cookies with Vite app
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], 
  credentials: true 
}));
app.use(express.json());

// Mount Better Auth router on Express
app.all('/api/auth/*', toNodeHandler(auth));

app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: async ({ req, res }) => {
      // Need to cast standard Express headers to Fetch Headers if needed,
      // but for now we can just let createTRPCContext handle it correctly or pass undefined
      // wait, createTRPCContext expects opts?: { headers?: Headers }.
      // We can create a basic Web Headers object from express headers
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
          headers.set(key, value);
        } else if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        }
      }
      return await createTRPCContext({ headers });
    },
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running with tRPC' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port} with tRPC at /api/trpc`);
});
