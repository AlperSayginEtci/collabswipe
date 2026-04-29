import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter, createTRPCContext } from '@collabswipe/api';

dotenv.config();


const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

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
