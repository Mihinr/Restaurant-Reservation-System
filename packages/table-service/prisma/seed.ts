import { PrismaClient } from '../node_modules/.prisma/table-service-client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding table service database...');

  // Helper function to create a Date with just time (using epoch date)
  const createTime = (timeString: string): Date => {
    const [hours, minutes, seconds = '00'] = timeString.split(':');
    const date = new Date('1970-01-01T00:00:00Z');
    date.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));
    return date;
  };

  const restaurants = [
    {
      name: 'The Grand Bistro',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '+12125551234',
      email: 'info@grandbistro.com',
      timezone: 'America/New_York',
      openingTime: createTime('11:00:00'),
      closingTime: createTime('22:00:00'),
    },
    {
      name: 'Coastal Kitchen',
      address: '456 Ocean Drive',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      phone: '+13105551234',
      email: 'info@coastalkitchen.com',
      timezone: 'America/Los_Angeles',
      openingTime: createTime('11:30:00'),
      closingTime: createTime('23:00:00'),
    },
    {
      name: 'Downtown Diner',
      address: '789 Market Street',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      phone: '+13125551234',
      email: 'info@downtowndiner.com',
      timezone: 'America/Chicago',
      openingTime: createTime('10:00:00'),
      closingTime: createTime('21:00:00'),
    },
  ];

  const createdRestaurants = [];

  for (const restaurantData of restaurants) {
    const restaurant = await prisma.restaurant.create({
      data: restaurantData,
    });
    createdRestaurants.push(restaurant);
  }

  const tableCapacities = [2, 2, 4, 4, 4, 6, 6, 8, 8, 10];

  for (const restaurant of createdRestaurants) {
    for (let i = 0; i < tableCapacities.length; i++) {
      await prisma.table.create({
        data: {
          restaurantId: restaurant.id,
          tableNumber: `T${i + 1}`,
          capacity: tableCapacities[i] || 4,
          minPartySize: 1,
        },
      });
    }
  }

  console.log('Seeding completed!');
  console.log(`Created ${createdRestaurants.length} restaurants`);
  console.log(`Created ${createdRestaurants.length * tableCapacities.length} tables`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
