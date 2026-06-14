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
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Better Auth requires proper CORS with credentials: true to share cookies with Vite app
app.use(cors({ 
  origin: (origin, callback) => {
    return callback(null, true); // Allow all origins for easy deployment
  }, 
  credentials: true 
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount Better Auth router on Express
app.all('/api/auth/*', toNodeHandler(auth));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'collabswipe',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  } as any,
});

const upload = multer({ storage });

// Upload Endpoint
app.post('/api/upload', (req, res, next) => {
  console.log('[/api/upload] Request received, content-type:', req.headers['content-type']);
  next();
}, upload.single('file'), (req, res) => {
  console.log('[/api/upload] multer done, file uploaded to Cloudinary');
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the public URL for the file from Cloudinary
  console.log('[/api/upload] Returning url:', req.file.path);
  res.json({ url: req.file.path });
});

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
    maxBodySize: 50 * 1024 * 1024, // 50MB
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
