import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('[Seed] Seeding database...');

  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  // Upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tmq.com' },
    update: {},
    create: {
      email: 'admin@tmq.com',
      name: 'Irie TMQ (Admin)',
      passwordHash: adminHash,
      role: 'ADMIN',
      quotaRemaining: 9999,
      emailVerified: true,
      whatsappNumber: '+1234567890',
      whatsappVerifiedAt: new Date(),
    },
  });

  // Upsert Regular User
  const user = await prisma.user.upsert({
    where: { email: 'user@tmq.com' },
    update: {},
    create: {
      email: 'user@tmq.com',
      name: 'Literary Editor',
      passwordHash: userHash,
      role: 'USER',
      quotaRemaining: 50,
      emailVerified: true,
      whatsappNumber: '+1987654321',
      whatsappVerifiedAt: new Date(),
    },
  });

  const providers = [
    { name: 'GPTZERO', weight: 1.0, health: 'HEALTHY' },
    { name: 'COPYLEAKS', weight: 1.0, health: 'HEALTHY' },
    { name: 'SAPLING', weight: 1.0, health: 'HEALTHY' },
    { name: 'ORIGINALITY', weight: 1.0, health: 'HEALTHY' },
    { name: 'WINSTON', weight: 1.0, health: 'HEALTHY' },
  ];

  for (const p of providers) {
    await prisma.provider.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }

  console.log('[Seed] Database ready with:');
  console.log(' - Admin: admin@tmq.com / admin123');
  console.log(' - User:  user@tmq.com / user123');
  console.log(' - 5 Providers enabled');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
