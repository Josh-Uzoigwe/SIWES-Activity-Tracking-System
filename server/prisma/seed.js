const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring default federal administrative accounts exist...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Ensure ITF Officer account exists without inserting dummy institutions or test students
  await prisma.supervisor.upsert({
    where: { email: 'itf@test.com' },
    update: {
      full_name: 'ITF SIWES Officer',
      role: 'ITF',
      password_hash: passwordHash,
    },
    create: {
      full_name: 'ITF SIWES Officer',
      email: 'itf@test.com',
      password_hash: passwordHash,
      role: 'ITF',
    },
  });

  console.log('Production-ready seed complete: only essential ITF administrative officer active.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
