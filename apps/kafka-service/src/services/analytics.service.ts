import prisma from '@packages/libs/prisma';

export const updateUserAnalaytics = async (event: any) => {
  try {
    console.log('💾 Starting analytics update for:', {
      userId: event.userId,
      action: event.action,
      productId: event.productId,
    });

    const existingData = await prisma.userAnalytics.findUnique({
      where: {
        userId: event.userId,
      },
      select: { actions: true },
    });

    console.log('📊 Existing data found:', !!existingData);

    let updatedActions: any = Array.isArray(existingData?.actions)
      ? [...(existingData.actions as any[])]
      : [];

    // Process based on action type
    if (event.action === 'product_view') {
      // Always store `product_view` for recommendations
      updatedActions.push({
        productId: event?.productId,
        shopId: event.shopId,
        action: event.action,
        timestamp: new Date(),
      });
      console.log('✅ Added product_view');
    } else if (event.action === 'add_to_cart') {
      // Check if add_to_cart already exists for this product
      const exists = updatedActions.some(
        (entry: any) =>
          entry.productId === event.productId && entry.action === 'add_to_cart'
      );
      if (!exists) {
        updatedActions.push({
          productId: event?.productId,
          shopId: event.shopId,
          action: event.action,
          timestamp: new Date(),
        });
        console.log('✅ Added add_to_cart');
      } else {
        console.log('⚠️  add_to_cart already exists, skipping');
      }
    } else if (event.action === 'remove_from_cart') {
      // Remove `add_to_cart` when `remove_from_cart` is triggered
      const beforeLength = updatedActions.length;
      updatedActions = updatedActions.filter(
        (entry: any) =>
          !(
            entry.productId === event.productId &&
            entry.action === 'add_to_cart'
          )
      );
      console.log(
        `✅ Removed add_to_cart (${beforeLength - updatedActions.length} removed)`
      );
    } else if (event.action === 'add_to_wishlist') {
      // Check if add_to_wishlist already exists for this product
      const exists = updatedActions.some(
        (entry: any) =>
          entry.productId === event.productId &&
          entry.action === 'add_to_wishlist'
      );
      if (!exists) {
        updatedActions.push({
          productId: event?.productId,
          shopId: event.shopId,
          action: event.action,
          timestamp: new Date(),
        });
        console.log('✅ Added add_to_wishlist');
      } else {
        console.log('⚠️  add_to_wishlist already exists, skipping');
      }
    } else if (event.action === 'remove_from_wishlist') {
      // Remove `add_to_wishlist` when `remove_from_wishlist` is triggered
      const beforeLength = updatedActions.length;
      updatedActions = updatedActions.filter(
        (entry: any) =>
          !(
            entry.productId === event.productId &&
            entry.action === 'add_to_wishlist'
          )
      );
      console.log(
        `✅ Removed add_to_wishlist (${beforeLength - updatedActions.length} removed)`
      );
    }

    // Keep only the last 200 actions (prevent storage overload)
    if (updatedActions.length > 200) {
      updatedActions = updatedActions.slice(-200);
    }

    const extraFields: Record<string, any> = {};
    if (event.country) {
      extraFields.country = event.country;
    }
    if (event.city) {
      extraFields.city = event.city;
    }
    if (event.device) {
      extraFields.device = event.device;
    }

    console.log('💿 Saving to database...');

    // Update or create user Analytics
    await prisma.userAnalytics.upsert({
      where: { userId: event.userId },
      update: {
        lastVisited: new Date(),
        actions: updatedActions,
        ...extraFields,
      },
      create: {
        userId: event?.userId,
        lastVisited: new Date(),
        actions: updatedActions,
        ...extraFields,
      },
    });

    console.log('✅ User analytics saved successfully');

    // Also update product analytics
    await updateProductAnalaytics(event);
  } catch (error) {
    console.error('❌ Error storing user analytics:', error);
  }
};

export const updateShopAnalytics = async (event: any) => {
  try {
    console.log('🏪 Updating shop analytics for shopId:', event.shopId);

    if (!event.shopId) {
      console.log('⚠️ Missing shopId, skipping shop analytics');
      return;
    }

    // Track unique visitors (upsert — no-op if already visited)
    let isNewVisitor = false;
    if (event.userId) {
      try {
        await prisma.uniqueShopVisitors.create({
          data: { shopId: event.shopId, userId: event.userId },
        });
        isNewVisitor = true;
        console.log('  → New unique visitor');
      } catch {
        // Duplicate key means this user already visited
        console.log('  → Returning visitor');
      }
    }

    // Fetch current shopAnalytics to merge JSON stat fields
    const existing = await prisma.shopAnalytics.findUnique({
      where: { shopId: event.shopId },
    });

    const mergeStats = (
      current: Record<string, number> | null | undefined,
      key: string | undefined
    ): Record<string, number> => {
      const stats: Record<string, number> = { ...(current ?? {}) };
      if (key) stats[key] = (stats[key] ?? 0) + 1;
      return stats;
    };

    const countryStats = mergeStats(
      existing?.countryStats as Record<string, number> | null,
      event.country
    );
    const cityStats = mergeStats(
      existing?.cityStats as Record<string, number> | null,
      event.city
    );
    const deviceStats = mergeStats(
      existing?.deviceStats as Record<string, number> | null,
      event.device
    );

    await prisma.shopAnalytics.upsert({
      where: { shopId: event.shopId },
      update: {
        totalVisitors: isNewVisitor ? { increment: 1 } : undefined,
        countryStats,
        cityStats,
        deviceStats,
        lastVisitedAt: new Date(),
      },
      create: {
        shopId: event.shopId,
        totalVisitors: 1,
        countryStats,
        cityStats,
        deviceStats,
        lastVisitedAt: new Date(),
      },
    });

    console.log('✅ Shop analytics saved successfully');
  } catch (error) {
    console.error('❌ Error updating shop analytics:', error);
  }
};

export const updateProductAnalaytics = async (event: any) => {
  try {
    console.log('📈 Updating product analytics for:', event.productId);

    if (!event.productId || !event.shopId) {
      console.log('⚠️ Missing productId or shopId, skipping product analytics');
      return;
    }

    // Define update fields dynamically
    const updateFields: any = {};
    if (event.action === 'product_view') {
      updateFields.views = { increment: 1 };
      console.log('  → Incrementing views');
    }
    if (event.action === 'add_to_cart') {
      updateFields.cartAdds = { increment: 1 };
      console.log('  → Incrementing cartAdds');
    }
    if (event.action === 'remove_from_cart') {
      updateFields.cartAdds = { decrement: 1 };
      console.log('  → Decrementing cartAdds');
    }
    if (event.action === 'add_to_wishlist') {
      updateFields.wishListAdds = { increment: 1 };
      console.log('  → Incrementing wishListAdds');
    }
    if (event.action === 'remove_from_wishlist') {
      updateFields.wishListAdds = { decrement: 1 };
      console.log('  → Decrementing wishListAdds');
    }
    if (event.action === 'purchase') {
      updateFields.purchases = { increment: 1 };
      console.log('  → Incrementing purchases');
    }

    // Update or create Product analytics asynchronously
    await prisma.productAnalytics.upsert({
      where: { productId: event.productId },
      update: {
        lastViewedAt: new Date(),
        ...updateFields,
      },
      create: {
        productId: event.productId,
        shopId: event.shopId,
        views: event.action === 'product_view' ? 1 : 0,
        cartAdds: event.action === 'add_to_cart' ? 1 : 0,
        wishListAdds: event.action === 'add_to_wishlist' ? 1 : 0,
        purchases: event.action === 'purchase' ? 1 : 0,
        lastViewedAt: new Date(),
      },
    });

    console.log('✅ Product analytics saved successfully');
  } catch (error) {
    console.error('❌ Error updating product analytics:', error);
  }
};
