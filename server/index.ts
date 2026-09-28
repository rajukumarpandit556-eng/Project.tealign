import express from 'express';
import { apiRouter } from './api.js';
import { getDb } from './db.js';
import { seedInitialData } from './seedData.js';

export async function createExpressApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize DB and Seed data
  try {
    const db = await getDb();
    await seedInitialData(db);
    console.log('Tealign database initialized and seeded successfully.');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }

  // Mount API router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), platform: 'Tealign' });
  });

  return app;
}
