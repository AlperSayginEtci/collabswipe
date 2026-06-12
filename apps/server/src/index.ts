import express from 'express';
// Trigger reload 6
import cors from 'cors';
import dotenv from 'dotenv';
import * as trpcExpress from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws from 'ws';
import { appRouter, createTRPCContext } from '@collabswipe/api';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@collabswipe/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Better Auth requires proper CORS with credentials: true to share cookies with Vite app
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://192.168.0.22:5173', 'http://192.168.0.22:3000', 'http://192.168.0.22:8081', 'exp://192.168.0.22:8081', 'http://localhost:8082', 'http://192.168.0.22:8082'], 
  credentials: true 
}));
app.use(express.json());

// Mount Better Auth router on Express
app.all('/api/auth/*', toNodeHandler(auth));

// Multer Storage Configuration
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the public URL for the file
  const fileUrl = `http://192.168.0.22:${port}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Express HTTP handler context
const createHttpContext = async ({ req, res }: trpcExpress.CreateExpressContextOptions) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    }
  }
  return await createTRPCContext({ headers });
};

app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createHttpContext,
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running with tRPC' });
});

const server = app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server is running on port ${port} with tRPC at /api/trpc`);
});

// WebSocket Server for tRPC Subscriptions
const wss = new ws.Server({ server });
const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: async ({ req }) => {
    // For WS, we convert req.headers similarly
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      }
    }
    return await createTRPCContext({ headers });
  }
});

wss.on('connection', (ws) => {
  console.log(`➕➕ WS Connection (${wss.clients.size})`);
  ws.once('close', () => {
    console.log(`➖➖ WS Connection (${wss.clients.size})`);
  });
});

console.log(`WebSocket Server attached on ws://localhost:${port}`);

process.on('SIGTERM', () => {
  console.log('SIGTERM');
  handler.broadcastReconnectNotification();
  wss.close();
});
// Trigger restart

// Trigger nodemon restart
