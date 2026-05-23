import prisma from '@packages/libs/prisma';

async function clearAnalytics() {
  try {
    console.log('🗑️  Deleting all analytics data...');

    // Delete all analytics records
    const [userCount, productCount, shopCount] = await Promise.all([
      prisma.userAnalytics.deleteMany({}),
      prisma.productAnalytics.deleteMany({}),
      prisma.shopAnalytics.deleteMany({}),
    ]);

    console.log('✅ Analytics data cleared:');
    console.log(`   - User analytics: ${userCount.count} records deleted`);
    console.log(`   - Product analytics: ${productCount.count} records deleted`);
    console.log(`   - Shop analytics: ${shopCount.count} records deleted`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing analytics:', error);
    process.exit(1);
  }
}

clearAnalytics();
