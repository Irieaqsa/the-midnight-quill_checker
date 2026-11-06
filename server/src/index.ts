import app from './app';
import { config } from './config';
import prisma from './config/database';

const PORT = config.port || 3001;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('[Database] Connected successfully to SQLite database.');

    // Seed default providers if table empty
    const providerCount = await prisma.provider.count();
    if (providerCount === 0) {
      const defaultProviders = [
        { name: 'GPTZERO', weight: 1.0, health: 'HEALTHY' },
        { name: 'COPYLEAKS', weight: 1.0, health: 'HEALTHY' },
        { name: 'SAPLING', weight: 1.0, health: 'HEALTHY' },
        { name: 'ORIGINALITY', weight: 1.0, health: 'HEALTHY' },
        { name: 'WINSTON', weight: 1.0, health: 'HEALTHY' },
      ];
      for (const p of defaultProviders) {
        await prisma.provider.create({ data: p });
      }
      console.log('[Database] Seeded 5 primary detector adapters.');
    }

    app.listen(PORT, () => {
      console.log(`[Server] TMQ Authenticity Desk API is active on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Bootstrap Error]:', err);
    process.exit(1);
  }
}

bootstrap();
