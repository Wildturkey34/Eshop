import prisma from '@packages/libs/prisma';
import cron from 'node-cron';
import { sendEmail } from '@packages/libs/email';

// Run daily at midnight - Delete expired sellers
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();

    // Find all sellers marked deleted and past the deletedAt date
    const expiredSellers = await prisma.sellers.findMany({
      where: {
        isDeleted: true,
        deletedAt: { lte: now },
      },
      include: { shop: true },
    });

    for (const seller of expiredSellers) {
      // Delete shop if exists
      if (seller.shop) {
        await prisma.shops.delete({
          where: { id: seller.shop.id },
        });
      }

      // Delete seller
      await prisma.sellers.delete({
        where: { id: seller.id },
      });
    }

    console.log(`✅ Deleted ${expiredSellers.length} expired sellers`);
  } catch (error) {
    console.error('❌ Error deleting expired sellers and shops:', error);
  }
});

// Run every hour - Check for low stock products and send alerts
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Find all active sellers with email notifications enabled
    const sellers = await prisma.sellers.findMany({
      where: {
        isDeleted: false,
        emailNotifications: true,
      },
      include: {
        shop: {
          include: {
            products: {
              where: {
                isDeleted: false,
                status: 'Active',
                // Only include products that haven't been alerted in the last 24 hours
                OR: [
                  { lastLowStockAlertAt: null },
                  { lastLowStockAlertAt: { lte: oneDayAgo } },
                ],
              },
            },
          },
        },
      },
    });

    let totalAlertsCreated = 0;
    let totalEmailsSent = 0;

    for (const seller of sellers) {
      if (!seller.shop) continue;

      // Find products with stock below seller's threshold
      const lowStockProducts = seller.shop.products.filter(
        (product) => product.stock <= seller.lowStockThreshold
      );

      for (const product of lowStockProducts) {
        // Create in-app notification
        await prisma.notifications.create({
          data: {
            title: '⚠️ Low Stock Alert',
            message: `Your product "${product.title}" is running low on stock. Current stock: ${product.stock} units.`,
            receiverId: seller.id,
            redirect_link: `/dashboard/all-products`,
          },
        });
        totalAlertsCreated++;

        // Send email if preference allows
        const shouldSendEmail =
          seller.notificationPreference === 'email' ||
          seller.notificationPreference === 'all';

        if (shouldSendEmail) {
          const emailSent = await sendEmail(
            seller.email,
            '⚠️ Low Stock Alert - Action Required',
            'low-stock-alert',
            {
              sellerName: seller.name,
              productTitle: product.title,
              currentStock: product.stock,
              threshold: seller.lowStockThreshold,
              category: product.category,
              productUrl: `${process.env.SELLER_FRONTEND_URL || 'http://localhost:3001'}/dashboard/all-products`,
            }
          );

          if (emailSent) totalEmailsSent++;
        }

        // Update last alert timestamp to prevent spam
        await prisma.products.update({
          where: { id: product.id },
          data: { lastLowStockAlertAt: now },
        });
      }
    }

    if (totalAlertsCreated > 0) {
      console.log(
        `✅ Low stock alerts: Created ${totalAlertsCreated} notifications, sent ${totalEmailsSent} emails`
      );
    }
  } catch (error) {
    console.error('❌ Error checking low stock products:', error);
  }
});
