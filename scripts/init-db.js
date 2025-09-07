const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Create super admin user
  const superAdmin = await prisma.user.upsert({
    where: { phone: '0770000000' },
    update: {},
    create: {
      phone: '0770000000',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true
    }
  })

  console.log('Super Admin created:', superAdmin)

  // Create sample ground owner
  const groundOwner = await prisma.user.upsert({
    where: { phone: '0771111111' },
    update: {},
    create: {
      phone: '0771111111',
      name: 'Sample Ground Owner',
      role: 'GROUND_OWNER',
      isActive: true
    }
  })

  console.log('Sample Ground Owner created:', groundOwner)

  // Create sample ground
  const sampleGround = await prisma.ground.create({
    data: {
      name: 'Colombo Futsal Center',
      description: 'Premium futsal ground in the heart of Colombo with modern facilities',
      location: '123 Galle Road, Colombo 03',
      city: 'Colombo',
      phone: '0771111111',
      email: 'info@colombofutsal.com',
      images: ['/placeholder-ground.jpg'],
      amenities: ['Parking', 'Changing Room', 'Water', 'Lighting'],
      morningPrice: 2500,
      eveningPrice: 3500,
      openingTime: '06:00',
      closingTime: '22:00',
      ownerId: groundOwner.id
    }
  })

  console.log('Sample Ground created:', sampleGround)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
