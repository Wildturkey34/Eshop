'use client';
import { shops } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import XIcon from 'apps/user-ui/src/assets/svgs/x-icon';
import YoutubeIcon from 'apps/user-ui/src/assets/svgs/youtube-icon';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import {
  Calendar,
  Clock,
  Globe,
  Heart,
  MapPin,
  Star,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import ProductCard from '../../components/cards/product-card';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import useUser from 'apps/user-ui/src/hooks/useUser';
import { sendKafkaEvent } from 'apps/user-ui/src/actions/track-user';

const TABS = ['Products', 'Offers', 'Reviews'];

const ShopReviewSection = ({ shopId, user }: { shopId: string; user: any }) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['shop-reviews', shopId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/seller/api/get-shop-reviews/${shopId}`);
      return res.data;
    },
    enabled: !!shopId,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post('/seller/api/create-shop-review', { shopId, rating, review }, { withCredentials: true });
    },
    onSuccess: () => {
      toast.success('Review submitted!');
      setRating(0);
      setReview('');
      queryClient.invalidateQueries({ queryKey: ['shop-reviews', shopId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    },
  });

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Ratings & Reviews
        </h3>
        {data?.totalReviews > 0 && (
          <span className="text-sm text-gray-500">
            ({data.totalReviews} {data.totalReviews === 1 ? 'review' : 'reviews'} · avg {Number(data.averageRating).toFixed(1)} ★)
          </span>
        )}
      </div>

      {user?.id ? (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="font-medium text-sm mb-2">Write a review</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="text-2xl transition"
              >
                <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              </button>
            ))}
          </div>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this shop (optional)..."
            className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
            rows={3}
          />
          <button
            onClick={() => {
              if (!rating) { toast.error('Please select a rating'); return; }
              mutation.mutate();
            }}
            disabled={mutation.isPending}
            className="mt-2 px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">
          <Link href="/login" className="text-blue-500 underline">Login</Link> to write a review.
        </p>
      )}

      {isLoading && <p className="text-gray-400 text-sm">Loading reviews...</p>}
      {!isLoading && data?.reviews?.length === 0 && (
        <p className="text-center py-6 text-gray-400">No reviews yet. Be the first!</p>
      )}
      <div className="space-y-4">
        {data?.reviews?.map((r: any) => (
          <div key={r.id} className="border border-gray-100 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {r.user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{r.user?.name ?? 'Anonymous'}</p>
                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < r.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                ))}
              </div>
            </div>
            {r.reviews && <p className="text-sm text-gray-600">{r.reviews}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

const SellerProfile = ({
  shop,
  followersCount,
}: {
  shop: shops;
  followersCount: number;
}) => {
  const [activeTab, setActiveTab] = useState('Products');
  const [followers, setFollowers] = useState(followersCount);
  const [isFollowing, setIsFollowing] = useState(false);

  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products', shop?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/seller/api/get-seller-products/${shop?.id}?page=1&limit=10`
      );
      return res.data.products;
    },
    enabled: !!shop?.id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!shop?.id) return;
      try {
        const res = await axiosInstance.get(
          `/seller/api/is-following/${shop?.id}`
        );
        setIsFollowing(res.data.isFollowing !== null);
      } catch (error) {
        console.error('Failed to fetch follow status', error);
      }
    };

    fetchFollowStatus();
  }, [shop?.id]);

  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: ['seller-events', shop?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/seller/api/get-seller-events/${shop?.id}?page=1&limit=10`
      );
      return res.data.products;
    },
    enabled: !!shop?.id,
    staleTime: 1000 * 60 * 5,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await axiosInstance.post('/seller/api/unfollow-shop', {
          shopId: shop?.id,
        });
      } else {
        await axiosInstance.post('/seller/api/follow-shop', {
          shopId: shop?.id,
        });
      }
    },
    onSuccess: () => {
      // Flip state only after successful request
      if (isFollowing) {
        setFollowers(followers - 1);
      } else {
        setFollowers(followers + 1);
      }
      setIsFollowing((prev) => !prev);
      queryClient.invalidateQueries({
        queryKey: ['is-following', shop?.id],
      });
    },
    onError: () => {
      console.error('Failed to follow/unfollow the shop.');
    },
  });

  useEffect(() => {
    if (!isLoading) {
      if (!location || !deviceInfo || !user?.id) return;
      sendKafkaEvent({
        userId: user?.id,
        shopId: shop?.id,
        action: 'shop_visit',
        country: location?.country || 'Unknown',
        city: location?.city || 'Unknown',
        device: deviceInfo || 'Unknown Device',
      });
    }
  }, [location, deviceInfo, isLoading]);

  return (
    <div>
      <div className="relative w-full flex justify-center">
        <Image
          src={
            shop?.coverBanner ||
            'https://ik.imagekit.io/fz0xzwtey/cover/1200%20x%20300.svg?updatedAt=1742072797684'
          }
          alt="Seller Cover"
          className="w-full h-[400px] object-cover"
          width={1200}
          height={300}
        />
      </div>

      {/* Seller Info Section */}
      <div className="w-[85%] lg:w-[70%] mt-[-50px] mx-auto relative z-20 flex flex-col lg:flex-row gap-6">
        <div className="bg-gray-200 p-6 rounded-lg shadow-lg flex-1">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="relative w-[100px] h-[100px] rounded-full border-4 border-slate-300 overflow-hidden">
              <Image
                src={
                  (shop as any)?.avatar?.[0]?.url ||
                  'https://ik.imagekit.io/fz0xzwtey/avatar/amazon.jpeg'
                }
                alt="Seller Avatar"
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="flex-1 w-full">
              <h1 className="text-2xl font-semibold text-slate-900">
                {shop?.name}
              </h1>
              <p className="text-slate-800 text-sm mt-1">
                {shop?.bio || 'No bio available.'}
              </p>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center text-blue-400 gap-1">
                  <Star fill="#60a5fa" size={18} />{' '}
                  <span>{shop?.ratings || 'N/A'}</span>
                </div>
                <div className="flex items-center text-slate-700 gap-1">
                  <Users size={18} /> <span>{followers} Followers</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 text-slate-700">
                <Clock size={18} />
                <span>{shop?.opening_hours || 'Mon - Sat: 9 AM - 6 PM'}</span>
              </div>

              <div className="flex items-center gap-2 mt-3 text-slate-700">
                <MapPin size={18} />{' '}
                <span>{shop?.address || 'No address provided'}</span>
              </div>
            </div>
            <button
              className={`px-6 py-2 h-[40px] rounded-lg font-semibold flex items-center gap-2 transition text-white ${
                isFollowing
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              onClick={() => toggleFollowMutation.mutate()}
              disabled={toggleFollowMutation.isPending}
            >
              <Heart size={18} />
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        </div>

        <div className="bg-gray-200 p-6 rounded-lg shadow-lg w-full lg:w-[30%]">
          <h2 className="text-xl font-semibold text-slate-900">Shop Details</h2>

          <div className="flex items-center gap-3 mt-3 text-slate-700">
            <Calendar size={18} />
            <span>
              Joined At: {new Date(shop?.createdAt!).toLocaleDateString()}
            </span>
          </div>

          {shop?.website && (
            <div className="flex items-center gap-3 mt-3 text-slate-700">
              <Globe size={18} />
              <Link
                href={shop?.website}
                className="hover:underline text-blue-600"
              >
                {shop?.website}
              </Link>
            </div>
          )}

          {shop?.socialLinks && shop?.socialLinks.length > 0 && (
            <div className="mt-3">
              <h3 className="text-slate-700 text-lg font-medium">Follow Us:</h3>
              <div className="flex gap-3 mt-2">
                {shop?.socialLinks?.map((link: any, index: number) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-[.9]"
                  >
                    {link.type === 'youtube' && <YoutubeIcon />}
                    {link.type === 'x' && <XIcon />}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="w-[85%] lg:w-[70%] mx-auto mt-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-300">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 text-lg font-semibold ${
                activeTab === tab
                  ? 'text-slate-800 border-b-2 border-blue-600'
                  : 'text-slate-600'
              } transition`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-gray-200 rounded-lg my-4 text-slate-700">
          {activeTab === 'Products' && (
            <div className="m-auto grid grid-cols-1 p-4 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {isLoading && (
                <>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
                    ></div>
                  ))}
                </>
              )}
              {products?.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {products?.length === 0 && (
                <p className="py-2">No products available yet!</p>
              )}
            </div>
          )}
          {activeTab === 'Offers' && (
            <div className="m-auto grid grid-cols-1 p-4 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
              {isEventsLoading && (
                <>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
                    ></div>
                  ))}
                </>
              )}
              {events?.map((product: any) => (
                <ProductCard
                  isEvent={true}
                  key={product.id}
                  product={product}
                />
              ))}
              {products?.length === 0 && (
                <p className="py-2">No offers available yet!</p>
              )}
            </div>
          )}
          {activeTab === 'Reviews' && (
            <ShopReviewSection shopId={shop?.id} user={user} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
