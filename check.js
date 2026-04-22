const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

prisma.profile.count()
  .then(c => console.log('Total profiles:', c))
  .catch(console.error)
  .finally(() => prisma.$disconnect())