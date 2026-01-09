'use client';
import { useQuery } from '@tanstack/react-query';
import ProfileIcon from 'apps/user-ui/src/assets/svgs/profile-icon';
import { navItems } from 'apps/user-ui/src/configs/constants';
import useUser from 'apps/user-ui/src/hooks/useUser';
import { useStore } from 'apps/user-ui/src/store';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { AlignLeft, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HeartIcon } from 'lucide-react';
import CartIcon from 'apps/user-ui/src/assets/svgs/cart-icon';

type NavItemsTypes = {
  title: string;
  href: string;
};

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const { user, isLoading } = useUser();

  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axiosInstance.get('/product/api/get-categories');
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShow(false);
        setExpandedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`w-full transition-all duration-300 ${
        isSticky ? 'fixed top-0 left-0 z-[100] bg-white shadow-lg' : 'relative'
      }`}
    >
      <div
        className={`w-[80%] relative m-auto flex items-center justify-between ${
          isSticky ? 'pt-3' : 'py-0'
        }`}
      >
        {/* All Departments Dropdown */}
        <div ref={dropdownRef} className="relative">
          <div
            className={`w-[260px] ${
              isSticky && '-mb-2'
            } cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#3489FF] hover:bg-[#2578ee] transition-colors`}
            onClick={() => setShow(!show)}
          >
            <div className="flex items-center gap-2">
              <AlignLeft color="white" />
              <span className="text-white font-medium">All Departments</span>
            </div>
            <ChevronDown
              color="white"
              className={`transition-transform ${show ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Dropdown menu */}
          {show && (
            <div
              className={`absolute left-0 ${
                isSticky ? 'top-[48px]' : 'top-[50px]'
              } w-[260px] max-h-[400px] overflow-y-auto bg-white shadow-lg border border-gray-200 rounded-b-lg z-50`}
            >
              {data?.categories && data.categories.length > 0 ? (
                data.categories.map((cat: string, i: number) => {
                  const hasSub = data.subCategories?.[cat]?.length > 0;
                  const isExpanded = expandedCategory === cat;

                  return (
                    <div key={i} className="relative">
                      <button
                        onClick={() => {
                          if (hasSub) {
                            setExpandedCategory((prev) =>
                              prev === cat ? null : cat
                            );
                          } else {
                            setShow(false);
                            window.location.href = `/products?category=${encodeURIComponent(
                              cat
                            )}`;
                          }
                        }}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-gray-800 font-medium">{cat}</span>
                        {hasSub && (
                          <ChevronRight
                            size={18}
                            className={`transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        )}
                      </button>

                      {/* Subcategories */}
                      {hasSub && isExpanded && (
                        <div className="bg-gray-50 border-l-4 border-blue-500">
                          {data.subCategories[cat].map(
                            (subCat: string, j: number) => (
                              <Link
                                key={j}
                                href={`/products?category=${encodeURIComponent(
                                  cat
                                )}&subCategory=${encodeURIComponent(subCat)}`}
                                onClick={() => {
                                  setShow(false);
                                  setExpandedCategory(null);
                                }}
                                className="block px-8 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                              >
                                {subCat}
                              </Link>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-5 py-3 text-gray-500 text-center">
                  No categories available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation links */}
        <div className="flex items-center">
          {navItems.map((i: NavItemsTypes, index: number) => (
            <Link
              className="px-5 font-medium text-lg hover:text-blue-600 transition-colors"
              href={i.href}
              key={index}
            >
              {i.title}
            </Link>
          ))}
        </div>

        {/* Sticky header icons */}
        <div>
          {isSticky && (
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                {!isLoading && user ? (
                  <>
                    <Link
                      href={'/profile'}
                      className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a] hover:border-blue-500 transition-colors"
                    >
                      <ProfileIcon />
                    </Link>
                    <Link
                      href={'/profile'}
                      className="hover:text-blue-600 transition-colors"
                    >
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
                      className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a] hover:border-blue-500 transition-colors"
                    >
                      <ProfileIcon />
                    </Link>
                    <Link
                      href={'/login'}
                      className="hover:text-blue-600 transition-colors"
                    >
                      <span className="block font-medium">Hello,</span>
                      <span className="font-semibold">
                        {isLoading ? '...' : 'Sign In'}
                      </span>
                    </Link>
                  </>
                )}
              </div>
              <div className="flex items-center gap-5">
                <Link
                  href={'/wishlist'}
                  className="relative hover:scale-110 transition-transform"
                >
                  <HeartIcon />
                  <div className="size-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                    <span className="text-white font-medium text-sm">
                      {wishlist?.length || 0}
                    </span>
                  </div>
                </Link>
                <Link
                  href={'/cart'}
                  className="relative hover:scale-110 transition-transform"
                >
                  <CartIcon />
                  <div className="size-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                    <span className="text-white font-medium text-sm">
                      {cart?.length || 0}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderBottom;
