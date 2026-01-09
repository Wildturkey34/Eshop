import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAndUpdateAdmin() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: pnpm tsx scripts/check-and-update-admin.ts <email> [newPassword]');
    process.exit(1);
  }

  try {
    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log('📋 Current user details:');
    console.log({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
    });

    // If new password is provided, update it
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updatedUser = await prisma.users.update({
        where: { email },
        data: {
          role: 'admin',
          password: hashedPassword
        },
      });

      console.log('\n✅ User updated successfully!');
      console.log('New details:', {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        passwordUpdated: true,
      });
      console.log('\n🔑 You can now login with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`   Role: admin`);
    } else {
      // Just update role to admin
      await prisma.users.update({
        where: { email },
        data: { role: 'admin' },
      });
      console.log('\n✅ User role updated to admin!');
      console.log('⚠️  Password was not changed. If you need to reset it, run:');
      console.log(`   pnpm tsx scripts/check-and-update-admin.ts ${email} <newPassword>`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateAdmin();
