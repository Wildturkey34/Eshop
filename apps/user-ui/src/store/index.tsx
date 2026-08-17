import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sendKafkaEvent } from '../actions/track-user';
import axiosInstance from '../utils/axiosInstance';

type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity?: number;
  shopId: string;
};

type Store = {
  cart: Product[];
  wishlist: Product[];
  clearStore: () => void;
  loadFromServer: (cart: Product[], wishlist: Product[]) => void;
  addToCart: (
    product: Product,
    user: any,
    location: any,
    deviceInfo: any
  ) => void;
  removeFromCart: (
    id: string,
    user: any,
    location: any,
    deviceInfo: any
  ) => void;
  addToWishlist: (
    product: Product,
    user: any,
    location: any,
    deviceInfo: any
  ) => void;
  removeFromWishlist: (
    id: string,
    user: any,
    location: any,
    deviceInfo: any
  ) => void;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],

      clearStore: () => set({ cart: [], wishlist: [] }),

      loadFromServer: (cart, wishlist) => set({ cart, wishlist }),

      //Add to cart
      addToCart: (product, user, location, deviceInfo) => {
        set((state) => {
          const existing = state.cart?.find((item) => item.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: (item.quantity ?? 1) + 1 }
                  : item
              ),
            };
          }
          return {
            cart: [
              ...state.cart,
              { ...product, quantity: product?.quantity ?? 1 },
            ],
          };
        });
        // Sync to server (fire and forget)
        if (user?.id) {
          const syncPrice = product.price ?? (product as any).sale_price ?? 0;
          const syncImage =
            product.image ?? (product as any).images?.[0]?.url ?? '';
          axiosInstance
            .post('/api/cart', {
              productId: product.id,
              title: product.title,
              price: syncPrice,
              image: syncImage,
              shopId: product.shopId,
              quantity: product.quantity ?? 1,
            })
            .catch(() => {});
          sendKafkaEvent({
            userId: user?.id,
            productId: product?.id,
            shopId: product?.shopId,
            action: 'add_to_cart',
            country: location?.country || 'Unknown',
            city: location?.city || 'Unknown',
            device: deviceInfo || 'Unknown Device',
          });
        }
      },

      //remove from cart
      removeFromCart: (id, user, location, deviceInfo) => {
        const removeProduct = get().cart.find((item) => item.id === id);

        set((state) => ({
          cart: state.cart?.filter((item) => item.id !== id),
        }));
        // Sync to server
        if (user?.id && removeProduct) {
          axiosInstance.delete(`/api/cart/${id}`).catch(() => {});
          sendKafkaEvent({
            userId: user?.id,
            productId: removeProduct?.id,
            shopId: removeProduct?.shopId,
            action: 'remove_from_cart',
            country: location?.country || 'Unknown',
            city: location?.city || 'Unknown',
            device: deviceInfo || 'Unknown Device',
          });
        }
      },

      //Add to wishlist
      addToWishlist: (product, user, location, deviceInfo) => {
        set((state) => {
          if (state.wishlist.find((item) => item.id === product.id))
            return state;
          return { wishlist: [...state.wishlist, product] };
        });
        // Sync to server
        if (user?.id) {
          const syncPrice = product.price ?? (product as any).sale_price ?? 0;
          const syncImage =
            product.image ?? (product as any).images?.[0]?.url ?? '';
          axiosInstance
            .post('/api/wishlist', {
              productId: product.id,
              title: product.title,
              price: syncPrice,
              image: syncImage,
              shopId: product.shopId,
            })
            .catch(() => {});
          sendKafkaEvent({
            userId: user?.id,
            productId: product?.id,
            shopId: product?.shopId,
            action: 'add_to_wishlist',
            country: location?.country || 'Unknown',
            city: location?.city || 'Unknown',
            device: deviceInfo || 'Unknown Device',
          });
        }
      },

      removeFromWishlist: (id, user, location, deviceInfo) => {
        const removeProduct = get().wishlist.find((item) => item.id === id);

        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== id),
        }));
        // Sync to server
        if (user?.id && removeProduct) {
          axiosInstance.delete(`/api/wishlist/${id}`).catch(() => {});
          sendKafkaEvent({
            userId: user?.id,
            productId: removeProduct?.id,
            shopId: removeProduct?.shopId,
            action: 'remove_from_wishlist',
            country: location?.country || 'Unknown',
            city: location?.city || 'Unknown',
            device: deviceInfo || 'Unknown Device',
          });
        }
      },
    }),
    { name: 'store-storage' }
  )
);
