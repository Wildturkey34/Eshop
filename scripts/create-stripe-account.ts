import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sellers = await prisma.sellers.findMany({
    where: { stripeId: { not: null } },
    select: { id: true, name: true, email: true, stripeId: true }
  });
  console.log('Sellers with stripeId:', JSON.stringify(sellers, null, 2));

  if (sellers.length === 0) {
    const allSellers = await prisma.sellers.findMany({
      select: { id: true, name: true, email: true, stripeId: true }
    });
    console.log('All sellers:', JSON.stringify(allSellers, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
