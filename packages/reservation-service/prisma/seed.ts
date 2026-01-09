import { PrismaClient } from '@prisma/client';
import { generateReservationNumber } from '../src/utils/reservationNumber';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reservation service database...');

  const userIds = Array.from({ length: 10 }, (_, i) => `user-${i + 1}`);
  const restaurantIds = ['rest-1', 'rest-2', 'rest-3'];
  const tableIds = Array.from({ length: 20 }, (_, i) => `table-${i + 1}`);

  const reservations = [];

  for (let i = 0; i < 30; i++) {
    const reservationDate = new Date();
    reservationDate.setDate(reservationDate.getDate() + Math.floor(Math.random() * 30));

    const hours = 11 + Math.floor(Math.random() * 11);
    const minutes = Math.random() < 0.5 ? 0 : 30;
    const reservationTime = new Date();
    reservationTime.setHours(hours, minutes, 0, 0);

    const reservation = await prisma.reservation.create({
      data: {
        reservationNumber: generateReservationNumber(),
        userId: userIds[Math.floor(Math.random() * userIds.length)] ?? userIds[0] ?? '',
        restaurantId: restaurantIds[Math.floor(Math.random() * restaurantIds.length)] ?? restaurantIds[0] ?? '',
        tableId: tableIds[Math.floor(Math.random() * tableIds.length)] ?? '',
        partySize: Math.floor(Math.random() * 8) + 1,
        reservationDate,
        reservationTime,
        durationMinutes: 90,
        status: ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED'][Math.floor(Math.random() * 4)] as any,
        customerName: `Customer ${i + 1}`,
        customerPhone: `+123456789${i}`,
      },
    });

    reservations.push(reservation);
  }

  console.log('Seeding completed!');
  console.log(`Created ${reservations.length} reservations`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

