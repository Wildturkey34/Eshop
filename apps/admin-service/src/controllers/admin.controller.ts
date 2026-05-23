import { ValidationError } from '@packages/error-handler';
import prisma from '@packages/libs/prisma';
import { NextFunction, Request, Response } from 'express';
import { sendLog } from '@packages/utils/logs/send-logs';

// get all products
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [products, totalProducts] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          sale_price: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          images: {
            select: { url: true },
            take: 1,
          },
          Shop: {
            select: { name: true },
          },
        },
      }),
      prisma.products.count(),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      data: products,
      meta: {
        totalProducts,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get all events
export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [events, totalEvents] = await Promise.all([
      prisma.products.findMany({
        where: {
          starting_date: {
            not: null,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          sale_price: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          starting_date: true,
          ending_date: true,
          images: {
            select: { url: true },
            take: 1,
          },
          Shop: {
            select: { name: true },
          },
        },
      }),
      prisma.products.count({
        where: {
          starting_date: {
            not: null,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalEvents / limit);

    res.status(200).json({
      success: true,
      data: events,
      meta: {
        totalEvents,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get all admins
export const getAllAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admins = await prisma.users.findMany({
      where: {
        role: 'admin',
      },
    });

    res.status(201).json({
      success: true,
      admins,
    });
  } catch (error) {
    next(error);
  }
};

// add new admin
export const addNewAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, role } = req.body;

    const isUser = await prisma.users.findUnique({ where: { email } });
    if (!isUser) {
      return next(new ValidationError('Something went wrong!'));
    }

    const updateRole = await prisma.users.update({
      where: { email },
      data: {
        role,
      },
    });

    console.log(`[admin-service] User promoted to admin: ${email}`);
    sendLog({
      type: 'warning',
      message: `User promoted to admin role: ${email}`,
      source: 'admin-service',
    });

    res.status(201).json({
      success: true,
      updateRole,
    });
  } catch (error) {
    next(error);
  }
};

// fetch all customizations
export const getAllCustomizations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();

    return res.status(200).json({
      categories: config?.categories || [],
      subCategories: config?.subCategories || {},
      logo: config?.logo || null,
      banner: config?.banner || null,
    });
  } catch (error) {
    return next(error);
  }
};

// get all users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      prisma.users.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.users.count(),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        totalUsers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get all sellers
export const getAllSellers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [sellers, totalSellers] = await Promise.all([
      prisma.sellers.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          shop: {
            select: {
              name: true,
              avatar: {
                select: {
                  id: true,
                  url: true,
                  file_id: true,
                },
              },
              address: true,
            },
          },
        },
      }),
      prisma.sellers.count(),
    ]);

    const totalPages = Math.ceil(totalSellers / limit);

    res.status(200).json({
      success: true,
      data: sellers,
      meta: {
        totalSellers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// get all notifications
export const getAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await prisma.notifications.findMany({
      where: {
        receiverId: 'admin',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// get all users notification
export const getUserNotifications = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await prisma.notifications.findMany({
      where: {
        receiverId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// dashboard stats for admin
export const getAdminDashboardStats = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [totalUsers, totalSellers, totalOrders, recentOrders, orders, allShopAnalytics, allUserAnalytics] =
      await Promise.all([
        prisma.users.count(),
        prisma.sellers.count(),
        prisma.orders.count(),
        prisma.orders.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, total: true, status: true, createdAt: true, userId: true },
        }),
        prisma.orders.findMany({
          where: { createdAt: { gte: sixMonthsAgo } },
          select: { total: true, createdAt: true },
        }),
        prisma.shopAnalytics.findMany({ select: { countryStats: true, deviceStats: true } }),
        prisma.userAnalytics.findMany({ select: { device: true } }),
      ]);

    // Monthly revenue
    const monthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, 0);
    }
    for (const order of orders) {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + order.total);
    }
    const monthlyRevenue = Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    // Aggregate country stats across all shops
    const countryMap = new Map<string, number>();
    for (const sa of allShopAnalytics) {
      const cs = (sa.countryStats ?? {}) as Record<string, number>;
      for (const [country, count] of Object.entries(cs)) {
        countryMap.set(country, (countryMap.get(country) ?? 0) + count);
      }
    }
    const countryData = Array.from(countryMap.entries()).map(([name, users]) => ({
      name,
      users,
      sellers: 0,
    }));

    // Aggregate device stats from userAnalytics
    const deviceMap: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    for (const ua of allUserAnalytics) {
      if (ua.device) deviceMap[ua.device] = (deviceMap[ua.device] ?? 0) + 1;
    }
    const deviceData = [
      { name: 'Phone', value: deviceMap['mobile'] ?? 0 },
      { name: 'Tablet', value: deviceMap['tablet'] ?? 0 },
      { name: 'Computer', value: deviceMap['desktop'] ?? 0 },
    ];

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalSellers,
        totalOrders,
        totalRevenue,
        monthlyRevenue,
        deviceData,
        countryData,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};
