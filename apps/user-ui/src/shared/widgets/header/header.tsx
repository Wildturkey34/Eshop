'use client';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import ProfileIcon from '../../../assets/svgs/profile-icon';
import HeaderBottom from './header-bottom';
import useUser from 'apps/user-ui/src/hooks/useUser';
import { useStore } from 'apps/user-ui/src/store';
import { useEffect, useRef, useState } from 'react';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import HeartIcon from 'apps/user-ui/src/assets/svgs/heart-icon';
import CartIcon from 'apps/user-ui/src/assets/svgs/cart-icon';
import Image from 'next/image';
import useLayout from 'apps/user-ui/src/hooks/useLayout';

const Header = () => {
  const { user, isLoading } = useUser();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const { layout } = useLayout();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const handleSearchClick = async () => {
    if (!searchQuery.trim()) return;

    setLoadingSuggestions(true);
    setShowSuggestions(true);

    try {
      const res = await axiosInstance.get(
        `/product/api/search-products?q=${encodeURIComponent(searchQuery)}`
      );
      setSuggestions(res.data.products || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full bg-white">
      <div className="w-[80%] py-5 m-auto flex items-center justify-between">
        <div>
          <Link href={'/'}>
            <Image
              src={
                layout?.logo ||
                'https://ik.imagekit.io/sjbr5usgh/logo/Blue%20Waves%20Surfing%20Club%20Logo.png?updatedAt=1744371251216'
              }
              width={300}
              height={100}
              alt=""
              className="h-[70px] ml-[-50px] mb-[-30px] object-cover"
            />
          </Link>
        </div>

        <div className="w-[50%] relative" ref={searchRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search for products..."
            className="w-full px-4 font-Poppins font-medium border-[2.5px] border-[#3489FF] outline-none h-[55px] rounded-l-md"
          />

          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-[70px] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}

          <button
            onClick={handleSearchClick}
            className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-[#3489FF] hover:bg-[#2578ee] transition-colors absolute top-0 right-0 rounded-r-md"
          >
            <Search color="#fff" size={22} />
          </button>

          {/* Suggestions dropdown */}
          {showSuggestions && !loadingSuggestions && suggestions.length > 0 && (
            <div className="absolute w-full top-[60px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
              {suggestions.map((item) => (
                <Link
                  href={`/product/${item.slug}`}
                  key={item.id}
                  onClick={() => {
                    setSuggestions([]);
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <img
                    src={item.image || item.images?.[0]?.url || '/placeholder.png'}
                    alt={item.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Rs. {item.price ?? item.sale_price ?? 0}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Loading state */}
          {loadingSuggestions && (
            <div className="absolute w-full top-[60px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-4 py-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">Searching...</span>
              </div>
            </div>
          )}

          {/* No results */}
          {showSuggestions &&
            !loadingSuggestions &&
            suggestions.length === 0 &&
            searchQuery.trim() && (
              <div className="absolute w-full top-[60px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-4 py-6 text-center">
                <p className="text-gray-500">
                  No products found for "{searchQuery}"
                </p>
              </div>
            )}
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            {!isLoading && user ? (
              <>
                <Link
                  href={'/profile'}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]"
                >
                  <ProfileIcon />
                </Link>
                <Link href={'/profile'}>
                  <span className="block font-medium">Hello,</span>
                  <span className="font-semibold">
                    {user?.name?.split(' ')[0]}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={'/login'}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]"
                >
                  <ProfileIcon />
                </Link>
                <Link href={'/login'}>
                  <span className="block font-medium">Hello,</span>
                  <span className="font-semibold">
                    {isLoading ? '...' : 'Sign In'}
                  </span>
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <Link href={'/wishlist'} className="relative">
              <HeartIcon />
              <div className="size-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                <span className="text-white font-medium text-sm">
                  {wishlist?.length}
                </span>
              </div>
            </Link>
            <Link href={'/cart'} className="relative">
              <CartIcon />
              <div className="size-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                <span className="text-white font-medium text-sm">
                  {cart?.length}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="border-b border-b-[#99999938]" />
      <HeaderBottom />
    </div>
  );
};

export default Header;
