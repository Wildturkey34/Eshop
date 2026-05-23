'use client';

import { useQuery } from '@tanstack/react-query';
import SectionTitle from '../shared/components/section/section-title';
import Hero from '../shared/modules/hero';
import axiosInstance from '../utils/axiosInstance';
import ProductCard from '../shared/components/cards/product-card';
import ShopCard from '../shared/components/cards/shop.card';
import useUser from '../hooks/useUser';

const Page = () => {
  const { user } = useUser();

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axiosInstance.get(
        '/product/api/get-all-products?page=1&limit=10'
      );
      return res.data.products;
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: latestProducts = [], isLoading: LatestProductsLoading } =
    useQuery({
      queryKey: ['latest-products'],
      queryFn: async () => {
        const res = await axiosInstance.get(
          '/product/api/get-all-products?page=1&limit=10&type=latest'
        );
        return res.data.products;
      },
      staleTime: 1000 * 60 * 2,
    });

  const { data: shops, isLoading: shopLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const res = await axiosInstance.get('/product/api/top-shops');
      return res.data.shops;
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const res = await axiosInstance.get(
        '/product/api/get-all-events?page=1&limit=10'
      );
      return res.data.events;
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: recommendations = [], isLoading: recoLoading } = useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(
        '/recommendation/api/recommendations',
        { withCredentials: true }
      );
      return res.data.recommendations;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      <Hero />
      <div className="md:w-[80%] w-[90%] mb-20 my-10 m-auto">

        {/* Personalised recommendations — only shown to logged-in users */}
        {user?.id && (
          <div className="mb-10">
            <div className="mb-8">
              <SectionTitle title="Recommended For You" />
            </div>
            {recoLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[350px] bg-gray-300 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            )}
            {!recoLoading && recommendations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
                {recommendations.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
            {!recoLoading && recommendations.length === 0 && (
              <p className="text-center text-gray-500">
                Browse some products to get personalised recommendations!
              </p>
            )}
          </div>
        )}

        <div className="mb-8">
          <SectionTitle title="Suggested Products" />
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-[350px] bg-gray-300 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-10">
            <p className="text-red-500 text-lg">Failed to load products</p>
          </div>
        )}

        {!isLoading && !isError && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5">
            {products?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">No products available yet!</p>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              ></div>
            ))}
          </div>
        )}

        <div className="my-8 block">
          <SectionTitle title="Latest Products" />
        </div>
        {!LatestProductsLoading && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {latestProducts?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {latestProducts?.length === 0 && (
          <p className="text-center">No products Available yet!</p>
        )}

        <div className="my-8 block">
          <SectionTitle title="Top Shops" />
        </div>

        {!shopLoading && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {shops?.map((shop: any) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}

        {shops?.length === 0 && (
          <p className="text-center">No Top shops Available yet!</p>
        )}

        <div className="my-8 block">
          <SectionTitle title="Top offers" />
        </div>
        {!offersLoading && !isError && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {offers?.map((product: any) => (
              <ProductCard key={product.id} product={product} isEvent={true} />
            ))}
          </div>
        )}
        {offers?.length === 0 && (
          <p className="text-center">No offers Available yet!</p>
        )}
      </div>
    </div>
  );
};

export default Page;
