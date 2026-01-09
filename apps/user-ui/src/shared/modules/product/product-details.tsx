'use client';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageSquareText,
  Package,
  WalletMinimal,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import ReactImageMagnify from 'react-image-magnify';
import Ratings from '../../components/ratings';
import Link from 'next/link';
import { useStore } from 'apps/user-ui/src/store';
import CartIcon from 'apps/user-ui/src/assets/svgs/cart-icon';
import useUser from 'apps/user-ui/src/hooks/useUser';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import ProductCard from '../../components/cards/product-card';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';

const ProductDetails = ({ productDetails }: { productDetails: any }) => {
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const [currentImage, setCurrentImage] = useState(
    productDetails?.images[0]?.url
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSelected, setIsSelected] = useState(
    productDetails?.colors?.[0] || ''
  );
  const [isSizeSelected, setIsSizeSelected] = useState(
    productDetails?.sizes?.[0] || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [priceRange, setPriceRange] = useState([0, 10000]); // Use default values
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  const addToCart = useStore((state: any) => state.addToCart);
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === productDetails.id);
  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some(
    (item: any) => item.id === productDetails.id
  );

  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentImage(productDetails?.images[currentIndex - 1]?.url);
    }
  };

  const nextImage = () => {
    if (currentIndex < productDetails?.images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImage(productDetails?.images[currentIndex + 1]?.url);
    }
  };

  const discountPercentage = Math.round(
    ((productDetails.regular_price - productDetails.sale_price) /
      productDetails.regular_price) *
      100
  );

  const fetchFilteredProducts = async () => {
    try {
      const query = new URLSearchParams();

      query.set('priceRange', priceRange.join(','));
      query.set('page', '1');
      query.set('limit', '5');

      const res = await axiosInstance.get(
        `/product/api/get-filtered-products?${query.toString()}`
      );
      setRecommendedProducts(res.data.products);
    } catch (error) {
      console.error('Failed to fetch filtered products', error);
    }
  };

  useEffect(() => {
    if (productDetails?.sale_price) {
      // Set the actual price range after product loads
      setPriceRange([
        Math.max(0, productDetails.sale_price - 500), // Lower bound
        productDetails.sale_price + 500, // Upper bound
      ]);
    }
  }, [productDetails]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [priceRange]);
  return (
    <div className="w-full bg-[#f5f5f5] py-5">
      <div className="w-[90%] bg-white lg:w-[80%] mx-auto pt-6 grid grid-cols-1 lg:grid-cols-[28%_44%_28%] gap-6 overflow-hidden">
        {/* left column - product images */}
        <div className="p-4">
          <div className="relative w-full">
            {/* Main Image with zoom */}
            <ReactImageMagnify
              {...{
                smallImage: {
                  alt: 'product Image',
                  isFluidWidth: true,
                  src:
                    currentImage ||
                    'https://ik.imagekit.io/fz0xzwtey/products/product-1741207782553-0_-RWfpGzfHt.jpg',
                },
                largeImage: {
                  src:
                    currentImage ||
                    'https://ik.imagekit.io/fz0xzwtey/products/product-1741207782553-0_-RWfpGzfHt.jpg',
                  width: 1200,
                  height: 1200,
                },
                enlargedImageContainerDimensions: {
                  width: '150%',
                  height: '150%',
                },
                enlargedImageStyle: {
                  border: 'none',
                  boxShadow: 'none',
                },
                enlargedImagePosition: 'right',
              }}
            />
          </div>
          {/* Thumbnail images array */}
          <div className="relative flex items-center gap-2 mt-4 overflow-hidden">
            {productDetails?.images?.length > 4 && (
              <button
                className="absolute left-0 bg-white p-2 rounded-full shadow-md z-10"
                onClick={prevImage}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="flex gap-2 overflow-x-auto">
              {productDetails?.images?.map((img: any, index: number) => (
                <Image
                  key={index}
                  src={
                    img?.url ||
                    'https://ik.imagekit.io/fz0xzwtey/products/product-1741207782553-0_-RWfpGzfHt.jpg'
                  }
                  alt="Thumbnail"
                  width={60}
                  height={60}
                  className={`cursor-pointer border rounded-lg p-1 ${
                    currentImage === img?.url
                      ? 'border-blue-500'
                      : 'border-gray-300' // Add .url here too
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setCurrentImage(img?.url); // Add .url here
                  }}
                />
              ))}
            </div>
            {productDetails?.images.length > 4 && (
              <button
                className="absolute right-0 bg-white p-2 rounded-full shadow-md z-10"
                onClick={nextImage}
                disabled={currentIndex === productDetails?.images.length - 1}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>

        {/*Middle column  - product details  */}
        <div className="p-4">
          <h1 className="text-xl mb-2  font-medium">{productDetails?.title}</h1>
          <div className="w-full flex items-center justify-between">
            <div className="flex gap-2 mt-2 text-yellow-500">
              <Ratings rating={productDetails?.rating} />
              <Link href={'#reviews'} className="text-blue-500 hover:underline">
                (0 reviews)
              </Link>
            </div>
            <div>
              <Heart
                size={25}
                fill={isWishlisted ? 'red' : 'transparent'}
                className="cursor-pointer"
                color={isWishlisted ? 'transparent' : '#777'}
                onClick={() =>
                  isWishlisted
                    ? removeFromWishlist(
                        productDetails.id,
                        user,
                        location,
                        deviceInfo
                      )
                    : addToWishlist(
                        {
                          ...productDetails,
                          quantity,
                          selectedOptions: {
                            color: isSelected,
                            size: isSizeSelected,
                          },
                        },

                        user,
                        location,
                        deviceInfo
                      )
                }
              />
            </div>
          </div>
          <div className="py-2 border-b border-gray-200">
            <span className="text-gray-500">Brand: </span>
            <span className="text-blue-500">
              {productDetails?.brand || 'No Brand'}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-orange-500">
              Rs.{productDetails?.sale_price}
            </span>
            <div className="flex gap-2 pb-2 text-lg border-b border-b-slate-200">
              <span className="text-gray-400 line-through">
                Rs {productDetails?.regular_price}
              </span>
              <span className="text-gray-500">-{discountPercentage}%</span>
            </div>
            <div className="mt-2">
              <div className="flex flex-col md:flex-row items-start gap-5 mt-4">
                {/* Color options */}
                {productDetails?.colors?.length > 0 && (
                  <div>
                    <strong>Color:</strong>
                    <div className="flex gap-2 mt-1">
                      {productDetails?.colors?.map(
                        (color: string, index: number) => (
                          <button
                            key={index}
                            className={`w-8 h-8 cursor-pointer rounded-full border-2 transition ${
                              isSelected === color
                                ? 'border-gray-400 scale-110 shadow-md'
                                : 'border-transparent'
                            }`}
                            onClick={() => setIsSelected(color)}
                            style={{ backgroundColor: color }}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}

                {productDetails?.sizes?.length > 0 && (
                  <div>
                    <strong>Size:</strong>
                    <div className="flex gap-2 mt-1">
                      {productDetails.sizes.map(
                        (size: string, index: number) => (
                          <button
                            key={index}
                            className={`px-4 py-1 cursor-pointer rounded-md transition ${
                              isSizeSelected === size
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-300 text-black'
                            }`}
                            onClick={() => setIsSizeSelected(size)}
                          >
                            {size}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md">
                  <button
                    className="px-3 cursor-pointer py-1 bg-gray-300 hover:bg-gray-400 text-black font-semibold rounded-l-md"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    -
                  </button>
                  <span className="px-4 bg-gray-100 py-1">{quantity}</span>
                  <button
                    className="px-3 py-1 cursor-pointer bg-gray-300 hover:bg-gray-400 text-black font-semibold rounded-r-md"
                    onClick={() => setQuantity((prev) => prev + 1)}
                  >
                    +
                  </button>
                </div>
                {productDetails?.stock > 0 ? (
                  <span className="text-green-600 font-semibold">
                    In Stock{' '}
                    <span className="text-gray-500 font-medium">
                      (Stock {productDetails?.stock})
                    </span>
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    Out of Stock
                  </span>
                )}
              </div>
              <button
                className={`flex mt-6 items-center gap-2 px-5 py-[10px] bg-[#ff5722] hover:bg-[#644a19] text-white font-medium rounded-lg transition ${
                  isInCart ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                disabled={isInCart || productDetails?.stock === 0}
                onClick={() =>
                  addToCart(
                    {
                      ...productDetails,
                      quantity,
                      selectedOptions: {
                        color: isSelected,
                        size: isSizeSelected,
                      },
                    },
                    user,
                    location,
                    deviceInfo
                  )
                }
              >
                <CartIcon size={18} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
        {/* right column1 - seller information */}
        <div className="bg-[#fafafa] -mt-6">
          <div className="mb-1 p-3 border-b border-b-gray-100">
            <span className="text-sm text-gray-500">Delivery Options</span>
            <div className="flex items-center text-gray-600 gap-1">
              <MapPin size={18} className="ml-[-5px]" />
              <span className="text-lg font-normal">
                {location?.city + ', ' + location?.country}
              </span>
            </div>
          </div>
          <div className="mb-1 px-3 pb-1 border-b border-b-gray-100">
            <span className="text-sm text-gray-600">Return & Warranty</span>
            <div className="flex items-center text-gray-600 gap-1">
              <Package size={18} className="ml-[-5px]" />
              <span className="text-base font-normal">
                7 Days returns policy
              </span>
            </div>
            <div className="flex items-center py-2 text-gray-600 gap-1">
              <WalletMinimal size={18} className="ml-[-5px]" />
              <span className="text-base font-normal">
                Warranty not available
              </span>
            </div>
          </div>

          <div className="px-3 py-1">
            <div className="w-[85%] rounded-lg">
              {/* sold by section */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600 font-light">
                    Sold by
                  </span>
                  <span className="block max-w-[150px] truncate font-medium text-lg">
                    {productDetails?.Shop?.name}
                  </span>
                </div>
                <Link
                  href={'#'}
                  //  onClick={() => handleChat()}
                  className="text-blue-500 text-sm flex items-center gap-1"
                >
                  <MessageSquareText />
                  Chat Now
                </Link>
              </div>
              {/* Seller performance stats */}

              <div className="grid grid-cols-3 gap-2 border-t border-t-gray-200 mt-3 pt-3">
                <div>
                  <p className="text-[12px] text-gray-500">
                    Positive Seller Ratings
                  </p>
                  <p className="text-lg font-semibold">88%</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500">Ship on Time</p>
                  <p className="text-lg font-semibold">100%</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500">
                    Chat Response Rate
                  </p>
                  <p className="text-lg font-semibold">100%</p>
                </div>
              </div>

              <div className="text-center mt-4 border-t border-t-gray-200 pt-2">
                <Link
                  href={`/shop/${productDetails?.Shop.id}`}
                  className="text-blue-500 font-medium text-sm hover:underline"
                >
                  GO TO STORE
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[90%] lg:w-[80%] mx-auto mt-5">
        <div className="bg-white min-h-[60vh] h-full p-5">
          <h3 className="text-lg font-semibold mb-4">
            Product Details of {productDetails?.title}
          </h3>
          <div
            className="prose prose-slate max-w-none overflow-hidden
        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-gray-900
        [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-gray-800
        [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:text-gray-800
        [&_p]:text-gray-700 [&_p]:mb-3 [&_p]:leading-relaxed
        [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3 [&_ul]:text-gray-700
        [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3 [&_ol]:text-gray-700
        [&_li]:mb-1 [&_li]:text-gray-700
        [&_strong]:font-semibold [&_strong]:text-gray-900
        [&_em]:italic [&_em]:text-gray-700
        [&_a]:text-blue-600 [&_a]:underline
        [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic
        [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm [&_code]:break-words
        [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:max-w-full
        [&_img]:rounded [&_img]:my-3 [&_img]:max-w-full [&_img]:h-auto
        [&_table]:w-full [&_table]:overflow-x-auto [&_table]:block
        [&_iframe]:max-w-full
        [&_*]:max-w-full"
            dangerouslySetInnerHTML={{
              __html: productDetails?.detailed_description,
            }}
          />
        </div>
      </div>

      <div className="w-[90%] lg:w-[80%] mx-auto">
        <div className="bg-white min-h-[50vh] h-full mt-5 p-5">
          <h3 className="text-lg font-semibold">
            Ratings & Reviews of {productDetails?.title}
          </h3>
          <p className="text-center pt-14">No Reviews available yet!</p>
        </div>
      </div>

      <div className="w-[90%] lg:w-[80%] mx-auto">
        <div className="w-full h-full my-5 p-5">
          <h3 className="text-xl font-semibold mb-2">You may also like</h3>
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {recommendedProducts?.map((i: any) => (
              <ProductCard key={i.id} product={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
