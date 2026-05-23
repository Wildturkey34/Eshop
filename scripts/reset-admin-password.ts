import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAIL = 'raunakghimire18@gmail.com'; // change if needed
const NEW_PASSWORD = 'Admin@1234';         // change to whatever you want

async function main() {
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);

  const user = await prisma.users.update({
    where: { email: EMAIL },
    data: { password: hash },
  });

  console.log(`✅ Password reset for: ${user.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
