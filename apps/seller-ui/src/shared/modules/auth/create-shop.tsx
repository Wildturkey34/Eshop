import { useMutation } from '@tanstack/react-query';
import { shopCategories } from 'apps/seller-ui/src/utils/categories';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axiosInstance from '../../../utils/axiosInstance';

const CreateShop = ({
  sellerId,
  setActiveStep,
}: {
  sellerId: string;
  setActiveStep: (step: number) => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const shopCreateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axiosInstance.post(
        `/api/create-shop`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      setActiveStep(3);
    },
  });

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: any) => {
    if (!avatarFile) {
      alert('Please upload a shop logo');
      return;
    }

    setUploading(true);

    try {
      // Upload avatar to ImageKit
      const base64Image = await convertFileToBase64(avatarFile);
      const uploadResponse = await axiosInstance.post(
        `/product/api/upload-product-image`,
        { fileName: base64Image }
      );

      const shopData = {
        ...data,
        sellerId,
        avatar: {
          fileId: uploadResponse.data.fileId,
          url: uploadResponse.data.file_url,
        },
      };

      shopCreateMutation.mutate(shopData);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const countWords = (text: string) => text.trim().split(/\s+/).length;

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className="text-2xl font-semibold text-center mb-4">
          Setup new shop
        </h3>

        <label className="block text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          placeholder="Shop Name"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register('name', {
            required: 'Name is required',
          })}
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{String(errors.name.message)}</p>
        )}

        <label className="block text-gray-700 mb-1">Shop Logo/Avatar *</label>
        <input
          type="file"
          accept="image/*"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          onChange={handleAvatarChange}
        />
        {avatarPreview && (
          <img
            src={avatarPreview}
            alt="Avatar preview"
            className="w-20 h-20 rounded-full object-cover mt-2 mb-2"
          />
        )}

        <label className="block text-gray-700 mb-1">
          Bio (Max 100 words) *
        </label>
        <textarea
          placeholder="Shop Bio"
          rows={3}
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register('bio', {
            required: 'Bio is required',
            validate: (value) =>
              countWords(value) <= 100 || "Bio can't exceed 100 words",
          })}
        />
        {errors.bio && (
          <p className="text-red-500 text-sm">{String(errors.bio.message)}</p>
        )}

        <label className="block text-gray-700 mb-1">Address *</label>
        <input
          type="text"
          placeholder="Shop Location"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register('address', {
            required: 'Shop Address is required',
          })}
        />
        {errors.address && (
          <p className="text-red-500 text-sm">
            {String(errors.address.message)}
          </p>
        )}

        <label className="block text-gray-700 mb-1">Opening Hours *</label>
        <input
          type="text"
          placeholder="e.g, Mon-Fri 9AM-6PM"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register('opening_hours', {
            required: 'Opening hours is required',
          })}
        />
        {errors.opening_hours && (
          <p className="text-red-500 text-sm">
            {String(errors.opening_hours.message)}
          </p>
        )}

        <label className="block text-gray-700 mb-1">Website</label>
        <input
          type="url"
          placeholder="https://example.com"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register('website', {
            pattern: {
              value: /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/,
              message: 'Enter a valid URL',
            },
          })}
        />
        {errors.website && (
          <p className="text-red-500 text-sm">
            {String(errors.website.message)}
          </p>
        )}

        <label className="block text-gray-700 mb-1">Category *</label>
        <select
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register('category', {
            required: 'Category is required',
          })}
        >
          <option value="">Select a category</option>
          {shopCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.value}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm">
            {String(errors.category.message)}
          </p>
        )}

        <button
          type="submit"
          disabled={shopCreateMutation.isPending || uploading}
          className="w-full text-lg bg-blue-600 text-white py-2 rounded-lg mt-4 disabled:bg-blue-400"
        >
          {uploading
            ? 'Uploading avatar...'
            : shopCreateMutation.isPending
              ? 'Creating...'
              : 'Create Shop'}
        </button>
      </form>
    </div>
  );
};

export default CreateShop;
