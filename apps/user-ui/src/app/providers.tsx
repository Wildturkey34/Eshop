'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import useUser from '../hooks/useUser';
import { WebSocketProvider } from '../context/web-socket-context';
import { useStore } from '../store';
import axiosInstance from '../utils/axiosInstance';

const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersWithWebSocket>{children}</ProvidersWithWebSocket>
      <Toaster />
    </QueryClientProvider>
  );
};

const ProvidersWithWebSocket = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useUser();
  const clearStore = useStore((state: any) => state.clearStore);
  const loadFromServer = useStore((state: any) => state.loadFromServer);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // undefined = first render (skip), null = logged out, string = logged in
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = user?.id ?? null;
      if (user?.id) {
        fetchAndLoadServerData(user.id);
      }
      return;
    }

    if (prevUserIdRef.current !== (user?.id ?? null)) {
      const prevId = prevUserIdRef.current;
      prevUserIdRef.current = user?.id ?? null;

      if (user?.id) {
        // User just logged in — sync any local guest items to server first, then load server state
        syncLocalAndLoad(user.id);
      } else if (prevId) {
        // User logged out — clear local store
        clearStore();
      }
    }
  }, [user?.id]);

  // On login: push any local-only items to server, then fetch full server state
  const syncLocalAndLoad = async (userId: string) => {
    const localCart = useStore.getState().cart;
    const localWishlist = useStore.getState().wishlist;

    try {
      // Push local items that were added as guest to server
      if (localCart.length > 0) {
        await axiosInstance
          .post('/api/cart/sync', {
            items: localCart.map((i: any) => ({
              productId: i.id,
              title: i.title,
              price: i.price ?? i.sale_price ?? 0,
              image: i.image ?? i.images?.[0]?.url ?? '',
              shopId: i.shopId,
              quantity: i.quantity ?? 1,
            })),
          })
          .catch(() => {});
      }
      if (localWishlist.length > 0) {
        await Promise.all(
          localWishlist.map((i: any) =>
            axiosInstance
              .post('/api/wishlist', {
                productId: i.id,
                title: i.title,
                price: i.price ?? i.sale_price ?? 0,
                image: i.image ?? i.images?.[0]?.url ?? '',
                shopId: i.shopId,
              })
              .catch(() => {})
          )
        );
      }
    } catch {
      // ignore
    }

    // Now fetch the full merged state from server
    await fetchAndLoadServerData(userId);
  };

  const fetchAndLoadServerData = async (userId?: string) => {
    try {
      const [cartRes, wishlistRes] = await Promise.all([
        axiosInstance.get('/api/cart'),
        axiosInstance.get('/api/wishlist'),
      ]);
      const cartItems = (cartRes.data.items ?? []).map((i: any) => ({
        id: i.productId,
        title: i.title,
        price: i.price,
        image: i.image,
        shopId: i.shopId,
        quantity: i.quantity,
      }));
      const wishlistItems = (wishlistRes.data.items ?? []).map((i: any) => ({
        id: i.productId,
        title: i.title,
        price: i.price,
        image: i.image,
        shopId: i.shopId,
      }));
      // Only now replace local state — after we have server data
      loadFromServer(cartItems, wishlistItems);
    } catch {
      // silently fail — keep whatever is in local store
    }
  };

  return <WebSocketProvider user={user}>{children}</WebSocketProvider>;
};

export default Providers;
