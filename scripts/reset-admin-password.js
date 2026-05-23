const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const prisma = new PrismaClient();

const EMAIL = 'raunakghimire18@gmail.com'; // your admin email
const NEW_PASSWORD = 'Admin@1234';          // your new password

async function main() {
  // First check the user exists and show their current role
  const existing = await prisma.users.findUnique({ where: { email: EMAIL } });
  if (!existing) {
    console.error(`❌ No user found with email: ${EMAIL}`);
    process.exit(1);
  }
  console.log(`Found user: ${existing.email} | role: ${existing.role}`);

  const hash = await bcrypt.hash(NEW_PASSWORD, 10);
  await prisma.users.update({ where: { email: EMAIL }, data: { password: hash } });

  console.log(`✅ Password updated successfully`);
  console.log(`   Email: ${EMAIL}`);
  console.log(`   New password: ${NEW_PASSWORD}`);
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
