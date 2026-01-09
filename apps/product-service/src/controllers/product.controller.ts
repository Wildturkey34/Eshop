import {
  AuthError,
  NotFoundError,
  ValidationError,
} from '@packages/error-handler';
import { imagekit } from '@packages/libs/imagekit';
import prisma from '@packages/libs/prisma';
import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

// get product categories
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();

    if (!config) {
      return res.status(404).json({ message: 'Categories not found!' });
    }

    return res.status(200).json({
      categories: config.categories,
      subCategories: config.subCategories,
    });
  } catch (error) {
    return next(error);
  }
};

// create discount codes
export const createDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { public_name, discountType, discountValue, discountCode } = req.body;

    const isDiscountCodeExist = await prisma.discount_codes.findUnique({
      where: { discountCode },
    });

    if (isDiscountCodeExist) {
      return next(
        new ValidationError(
          'Discount code already exists please use a different code!'
        )
      );
    }

    const discount_code = await prisma.discount_codes.create({
      data: {
        public_name,
        discountType,
        discountValue: parseFloat(discountValue),
        discountCode,
        sellerId: req.seller.id,
      },
    });

    res.status(201).json({
      success: true,
      discount_code,
    });
  } catch (error) {
    return next(error);
  }
};

// get discount codes
export const getDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const discount_codes = await prisma.discount_codes.findMany({
      where: {
        sellerId: req.seller.id,
      },
    });

    res.status(201).json({
      success: true,
      discount_codes,
    });
  } catch (error) {
    return next(error);
  }
};

// delete discount codes
export const deleteDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const sellerId = req.seller?.id;

    const discountCode = await prisma.discount_codes.findUnique({
      where: { id },
      select: { id: true, sellerId: true },
    });

    if (!discountCode) {
      return next(new NotFoundError('Discount code not found!'));
    }

    if (discountCode.sellerId !== sellerId) {
      return next(new ValidationError('Unauthorized Access!'));
    }

    await prisma.discount_codes.delete({ where: { id } });

    return res.status(200).json({
      message: 'Discount code succesfully deleted!',
    });
  } catch (error) {
    return next(error);
  }
};

//upload product image
export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileName } = req.body;

    const response = await imagekit.upload({
      file: fileName,
      fileName: `product-${Date.now()}.jpg`,
      folder: '/products',
    });

    res.status(201).json({
      file_url: response.url,
      fileId: response.fileId,
    });
  } catch (error) {
    return next(error);
  }
};

//delete product image
export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = req.body;

    const response = await imagekit.deleteFile(fileId);
    res.status(201).json({
      success: true,
      response,
    });
  } catch (error) {
    return next(error);
  }
};

// create product
export const createProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      short_description,
      detailed_description,
      warranty,
      custom_specifications,
      slug,
      tags,
      cash_on_delivery,
      brand,
      video_url,
      category,
      colors = [],
      sizes = [],
      discountCodes = [], // ADD DEFAULT - prevents error if undefined
      stock,
      sale_price,
      regular_price,
      subCategory,
      custom_properties = {}, // CHANGED: frontend sends "custom_properties" not "customProperties"
      images = [],
      starting_date, // Event-specific field
      ending_date,   // Event-specific field
    } = req.body;

    if (
      !title ||
      !slug ||
      !short_description ||
      !category ||
      !subCategory ||
      !sale_price ||
      !tags ||
      !stock ||
      !warranty
      // REMOVED !regular_price - it's optional in frontend
      // REMOVED !images - we'll validate this properly below
    ) {
      return next(new ValidationError('Missing required fields'));
    }

    if (!req.seller?.id) {
      return next(new AuthError('Only seller can create products!'));
    }

    if (!req.seller?.shop?.id) {
      return next(
        new ValidationError('You must have a shop to create products!')
      );
    }

    const slugChecking = await prisma.products.findUnique({
      where: { slug },
    });

    if (slugChecking) {
      return next(
        new ValidationError('Slug already exists! Please use a different slug!')
      );
    }

    // VALIDATE images array properly
    const validImages = images.filter(
      (img: any) => img && img.fileId && img.file_url
    );

    if (validImages.length === 0) {
      return next(
        new ValidationError('At least one product image is required!')
      );
    }

    const newProduct = await prisma.products.create({
      data: {
        title,
        short_description,
        detailed_description: detailed_description || '', // Handle optional
        warranty,
        cashOnDelivery: cash_on_delivery || 'yes', // Default to 'yes'
        slug,
        shopId: req.seller.shop.id,
        tags:
          typeof tags === 'string'
            ? tags.split(',').map((t: string) => t.trim())
            : tags,
        brand: brand || '', // Handle optional
        video_url: video_url || '', // Handle optional
        category,
        subCategory,
        colors: Array.isArray(colors) ? colors : [],
        discount_codes: Array.isArray(discountCodes) ? discountCodes : [],
        sizes: Array.isArray(sizes) ? sizes : [],
        stock: parseInt(stock),
        sale_price: parseFloat(sale_price),
        regular_price: regular_price
          ? parseFloat(regular_price)
          : parseFloat(sale_price), // Use sale_price if regular_price not provided
        custom_properties: custom_properties || {},
        custom_specifications: custom_specifications || {},
        starting_date: starting_date ? new Date(starting_date) : null, // Event field
        ending_date: ending_date ? new Date(ending_date) : null,       // Event field
        images: {
          create: validImages.map((image: any) => ({
            file_id: image.fileId,
            url: image.file_url,
          })),
        },
      },
      include: { images: true },
    });

    res.status(201).json({
      success: true,
      product: newProduct, // Changed from newProduct for consistency
    });
  } catch (error) {
    return next(error);
  }
};

//get logged in seller products
export const getShopProducts = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await prisma.products.findMany({
      where: {
        shopId: req?.seller?.shop?.id,
      },
      include: {
        images: true,
      },
    });

    res.status(201).json({
      success: true,
      products,
    });
  } catch (error) {
    return next(error);
  }
};

//delete product
export const deleteProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller?.shop?.id;

    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, isDeleted: true },
    });

    if (!product) {
      return next(new NotFoundError('Product not found!'));
    }

    if (product.shopId !== sellerId) {
      return next(new AuthError('Unauthorized action'));
    }

    if (product.isDeleted) {
      return next(new ValidationError('Product is already deleted'));
    }

    const deleteProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        deletedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return res.status(200).json({
      message:
        'Product is scheduled for deletion in 24 hours. You can restore within this time frame.',
      deletedAt: deleteProduct.deletedAt,
    });
  } catch (error) {
    return next(error);
  }
};

//restore product
export const restoreProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller?.shop?.id;

    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, isDeleted: true },
    });

    if (!product) {
      return next(new NotFoundError('Product not found'));
    }

    if (product.shopId !== sellerId) {
      return next(new AuthError('Unauthorized action'));
    }

    if (!product.isDeleted) {
      return next(new ValidationError('Product is not in deleted state'));
    }

    await prisma.products.update({
      where: { id: productId },
      data: { isDeleted: false, deletedAt: null },
    });

    return res.status(200).json({ message: 'Product successfully restored!' });
  } catch (error) {
    return next(error);
  }
};

// Get Stripe account details
// get seller stripe information
export const getStripeAccount = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerData = await prisma.sellers.findUnique({
      where: { id: req.seller.id },
      select: { stripeId: true },
    });

    if (!sellerData?.stripeId) {
      return next(new ValidationError('No Stripe account linked!'));
    }

    // Fetch Stripe account details
    const stripeAccount = await stripe.accounts.retrieve(sellerData.stripeId);

    // Fetch last payout (if available)
    const payouts = await stripe.payouts.list(
      { limit: 1 },
      { stripeAccount: stripeAccount.id }
    );
    const lastPayout = payouts?.data.length
      ? new Date(payouts.data[0].created * 1000).toLocaleDateString()
      : null;

    return res.status(200).json({
      success: true,
      stripeAccount: {
        id: stripeAccount.id,
        email: stripeAccount.email || 'Not available',
        business_name:
          stripeAccount.business_profile?.name ||
          stripeAccount.individual?.first_name +
          ' ' +
          stripeAccount.individual?.last_name ||
          'N/A',
        country: stripeAccount.country || 'Unknown',
        payouts_enabled: stripeAccount.payouts_enabled,
        charges_enabled: stripeAccount.charges_enabled,
        last_payout: lastPayout || 'No payouts yet',
        dashboard_url: `https://connect.stripe.com/app/express_dashboard/${stripeAccount.id}`,
      },
    });
  } catch (error) {
    return next(error);
  }
};

//get all products
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type as string;

    const baseFilter = {
      isDeleted: false,
      status: 'Active' as const,
    };

    const orderBy: Prisma.productsOrderByWithRelationInput =
      type === 'latest' ? { createdAt: 'desc' } : { total_sales: 'desc' };

    const [products, total, top10Products] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        include: {
          images: true,
          Shop: {
            select: {
              id: true,
              name: true,
              sellerId: true,
              ratings: true,
              address: true,
              avatar: {
                select: {
                  id: true,
                  url: true,
                  file_id: true,
                },
              },
            },
          },
        },
        where: baseFilter,
        orderBy,
      }),
      prisma.products.count({ where: baseFilter }),
      prisma.products.findMany({
        take: 10,
        include: {
          images: true,
          Shop: {
            select: {
              id: true,
              name: true,
              sellerId: true,
              ratings: true,
              address: true,
              avatar: {
                select: {
                  id: true,
                  url: true,
                  file_id: true,
                },
              },
            },
          },
        },
        where: baseFilter,
        orderBy,
      }),
    ]);

    return res.status(200).json({
      success: true,
      products,
      top10By: type === 'latest' ? 'latest' : 'topSales',
      top10Products,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

//get all events
export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const baseFilter = {
      AND: [{ starting_date: { not: null } }, { ending_date: { not: null } }],
    };

    const [events, total, top10BySales] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        where: baseFilter,
        include: {
          images: true,
          Shop: true,
        },
        orderBy: {
          total_sales: 'desc',
        },
      }),
      prisma.products.count({ where: baseFilter }),
      prisma.products.findMany({
        where: baseFilter,
        take: 10,
        orderBy: {
          total_sales: 'desc',
        },
      }),
    ]);

    res.status(200).json({
      events,
      top10BySales,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

//get product details
export const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await prisma.products.findUnique({
      where: {
        slug: req.params.slug!,
      },
      include: {
        images: true,
        Shop: {
          include: {
            avatar: {
              select: {
                id: true,
                url: true,
                file_id: true,
              },
            },
          },
        },
      },
    });
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    return next(error);
  }
};

export const getFilteredProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      priceRange = [0, 10000],
      categories = [],
      colors = [],
      sizes = [],
      page = 1,
      limit = 12,
    } = req.query;

    const parsedPriceRange =
      typeof priceRange === 'string'
        ? priceRange.split(',').map(Number)
        : [0, 10000];
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {
      isDeleted: false,
      status: 'Active',
      sale_price: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
    };

    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(','),
      };
    }

    if (colors && (colors as string[]).length > 0) {
      filters.colors = {
        hasSome: Array.isArray(colors) ? colors : [colors],
      };
    }

    if (sizes && (sizes as string[]).length > 0) {
      filters.sizes = {
        hasSome: Array.isArray(sizes) ? sizes : [sizes],
      };
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          Shop: true,
        },
      }),
      prisma.products.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    // Set cache headers to prevent stale 304 responses
    res.setHeader('Cache-Control', 'public, max-age=60');

    res.json({
      products,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// get filtered offers
export const getFilteredEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      priceRange = [0, 10000],
      categories = [],
      colors = [],
      sizes = [],
      page = 1,
      limit = 12,
    } = req.query;

    const parsedPriceRange =
      typeof priceRange === 'string'
        ? priceRange.split(',').map(Number)
        : [0, 10000];

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {
      sale_price: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
      NOT: {
        starting_date: null,
      },
    };

    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(','),
      };
    }

    if (colors && (colors as string[]).length > 0) {
      filters.colors = {
        hasSome: Array.isArray(colors) ? colors : [colors],
      };
    }

    if (sizes && (sizes as string[]).length > 0) {
      filters.sizes = {
        hasSome: Array.isArray(sizes) ? sizes : [sizes],
      };
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          Shop: true,
        },
      }),
      prisma.products.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.json({
      products,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

//get filtered shops
export const getFilteredShops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categories = [], countries = [], page = 1, limit = 12 } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {};

    if (categories && String(categories).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(','),
      };
    }

    if (countries && String(countries).length > 0) {
      filters.country = {
        in: Array.isArray(countries) ? countries : String(countries).split(','),
      };
    }

    const [shops, total] = await Promise.all([
      prisma.shops.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          sellers: true,
          followers: true,
          products: true,
        },
      }),
      prisma.shops.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.json({
      shops,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
};

//search products
export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const products = await prisma.products.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            short_description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({ products });
  } catch (error) {
    return next(error);
  }
};

//top shops
export const topShops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Aggregate total sales per shop from orders i.e which shop has the most orders
    const topShopsData = await prisma.orders.groupBy({
      by: ['shopId'],
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 10,
    });

    // Fetch the corresponding shop details
    const shopIds = topShopsData.map((item) => item.shopId);

    const shops = await prisma.shops.findMany({
      where: {
        id: {
          in: shopIds,
        },
      },
      select: {
        id: true,
        name: true,
        avatar: {
          select: {
            id: true,
            url: true,
            file_id: true,
          },
        },
        coverBanner: true,
        address: true,
        ratings: true,
        followers: true,
        category: true,
      },
    });

    // Merge sales with shop data
    const enrichedShops = shops.map((shop) => {
      const salesData = topShopsData.find((s) => s.shopId === shop.id);
      return {
        ...shop,
        totalSales: salesData?._sum.total ?? 0,
      };
    });

    const top10Shops = enrichedShops
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);

    return res.status(200).json({ shops: top10Shops }); //this shows the shop with most orders to get all shops just send only shops instead of shops: top10Shops
  } catch (error) {
    console.error('Error fetching top shops:', error);
    return next(error);
  }
};

// slug validator
export const slugValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { slug } = req.body;

    if (!slug || typeof slug !== 'string') {
      return next(
        new ValidationError('Slug is required and must be a string.')
      );
    }

    // Slugify manually (no slugify lib)
    slug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50); // cap to 50 chars

    let uniqueSlug = slug;
    let counter = 1;

    while (
      await prisma.products.findUnique({
        where: { slug: uniqueSlug },
      })
    ) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return res.status(200).json({
      available: uniqueSlug === slug,
      slug: uniqueSlug,
    });
  } catch (error) {
    return next(error);
  }
};

// get product analytics
export const getProductAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const analytics = await prisma.productAnalytics.findUnique({
      where: {
        productId: req.params.productId,
      },
    });
    res.status(201).json({
      success: true,
      analytics,
    });
  } catch (error) {
    return next(error);
  }
};
