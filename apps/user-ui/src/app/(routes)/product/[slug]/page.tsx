import ProductDetails from 'apps/user-ui/src/shared/modules/product/product-details';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { Metadata } from 'next';

async function fetchProductDetails(slug: string) {
  const response = await axiosInstance.get(`/product/api/get-product/${slug}`); // Fixed the template string here too
  return response.data.product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>; // Changed type to Promise
}): Promise<Metadata> {
  const { slug } = await params; // Await params first
  const product = await fetchProductDetails(slug);

  return {
    title: `${product?.title} | Eshop marketplace`,
    description:
      product?.short_description ||
      'Discover high quality products on Eshop marketplace.',
    openGraph: {
      title: product?.title,
      description: product?.short_description || '',
      images: [product?.images?.[0]?.url || '/default-image.jpg'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product?.title,
      description: product?.short_description || '',
      images: [product?.images?.[0]?.url || '/default-image.jpg'],
    },
  };
}

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  // Changed type to Promise
  const { slug } = await params; // Await params first
  const productDetails = await fetchProductDetails(slug);

  return <ProductDetails productDetails={productDetails} />;
};

export default Page;
