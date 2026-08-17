import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const seller = await prisma.sellers.update({
    where: { email: 'raunakghimire18@gmail.com' },
    data: { stripeId: 'acct_1ToydV5DVWC3fAaX' },
  });
  console.log('Updated seller stripeId:', seller.stripeId);
}

main().catch(console.error).finally(() => prisma.$disconnect());
