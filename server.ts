import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createExpressApp } from './server/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = await createExpressApp();
  const PORT = Number(process.env.PORT) || 3000;

  // Serve static assets from Vite build in production
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));

  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tealign production server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
