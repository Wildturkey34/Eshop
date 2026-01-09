import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  // Replace this with the email of the user you want to make admin
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: pnpm tsx scripts/make-admin.ts <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    const updatedUser = await prisma.users.update({
      where: { email },
      data: { role: 'admin' },
    });

    console.log('✅ User updated successfully!');
    console.log('User details:', {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
