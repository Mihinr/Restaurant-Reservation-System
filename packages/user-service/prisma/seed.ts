import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding user service database...');

  const adminPassword = await hashPassword('admin123');
  const staffPassword = await hashPassword('staff123');
  const customerPassword = await hashPassword('customer123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      phone: '+1234567890',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@restaurant.com' },
    update: {},
    create: {
      email: 'staff@restaurant.com',
      firstName: 'Staff',
      lastName: 'Member',
      passwordHash: staffPassword,
      role: 'STAFF',
      phone: '+1234567891',
    },
  });

  for (let i = 1; i <= 10; i++) {
    await prisma.user.upsert({
      where: { email: `customer${i}@example.com` },
      update: {},
      create: {
        email: `customer${i}@example.com`,
        firstName: `Customer${i}`,
        lastName: 'Test',
        passwordHash: customerPassword,
        role: 'CUSTOMER',
        phone: `+123456789${i + 1}`,
      },
    });
  }

  console.log('Seeding completed!');
  console.log('Admin user:', admin.email);
  console.log('Staff user:', staff.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

