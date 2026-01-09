'use client';
import { MoveRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();
  return (
    <div className="bg-[#115061] min-h-[85vh] flex flex-col justify-center w-full py-8">
      <div className="md:w-[80%] w-[90%] m-auto md:flex items-center gap-8">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <p className="font-Roboto font-normal text-white pb-2 text-xl">
            Starting from Rs 40
          </p>
          <h1 className="text-white text-4xl md:text-6xl font-extrabold font-Roboto leading-tight">
            The best watch <br />
            Collection 2025
          </h1>
          <p className="font-Oregano text-2xl md:text-3xl pt-4 text-white">
            Exclusive offer <span className="text-yellow-400">-10%</span> off
            this week
          </p>
          <br />
          <button
            onClick={() => router.push('/products')}
            className="bg-white text-[#115061] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
          >
            Shop Now <MoveRight size={20} />
          </button>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <Image
            src="https://ik.imagekit.io/fz0xzwtey/products/slider-img-1.png?updatedAt=1744358118885"
            alt="Smart watch collection"
            width={450}
            height={450}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
