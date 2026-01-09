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

    let updatedActions: any = existingData?.actions || [];

    const actionExists = updatedActions.some(
      (entry: any) =>
        entry.productId === event.productId && entry.action === event.action
    );

    // Always store `product_view` for recommendations
    if (event.action === 'product_view') {
      updatedActions.push({
        productId: event?.productId,
        shopId: event.shopId,
        action: event.action,
        timestamp: new Date(),
      });
    }
    // Add to cart/wishlist only if not already exists
    else if (
      ['add_to_cart', 'add_to_wishlist'].includes(event.action) &&
      !actionExists
    ) {
      updatedActions.push({
        productId: event?.productId,
        shopId: event.shopId,
        action: event?.action,
        timestamp: new Date(),
      });
    }
    // Remove `add_to_cart` when `remove_from_cart` is triggered
    else if (event.action === 'remove_from_cart') {
      updatedActions = updatedActions.filter(
        (entry: any) =>
          !(
            entry.productId === event.productId &&
            entry.action === 'add_to_cart'
          )
      );
    }
    // Remove `add_to_wishlist` when `remove_from_wishlist` is triggered
    else if (event.action === 'remove_from_wishlist') {
      updatedActions = updatedActions.filter(
        (entry: any) =>
          !(
            entry.productId === event.productId &&
            entry.action === 'add_to_wishlist'
          )
      );
    }

    // Keep only the last 100 actions (prevent storage overload)
    if (updatedActions.length > 100) {
      updatedActions.shift();
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

export const updateProductAnalaytics = async (event: any) => {
  try {
    console.log('📈 Updating product analytics for:', event.productId);

    if (!event.productId || !event.shopId) {
      console.log('⚠️ Missing productId or shopId, skipping product analytics');
      return;
    }

    // Define update fields dynamically
    const updateFields: any = {};
    if (event.action === 'product_view') updateFields.views = { increment: 1 };
    if (event.action === 'add_to_cart')
      updateFields.cartAdds = { increment: 1 };
    if (event.action === 'remove_from_cart')
      updateFields.cartAdds = { decrement: 1 };
    if (event.action === 'add_to_wishlist')
      updateFields.wishListAdds = { increment: 1 };
    if (event.action === 'remove_from_wishlist')
      updateFields.wishListAdds = { decrement: 1 };
    if (event.action === 'purchase') updateFields.purchases = { increment: 1 };

    console.log('📊 Update fields:', updateFields);

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
