import React, { useState } from 'react';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const ImagePlaceHolder = ({
  small,
  size,
  defaultImage = null,
  index = 0,
  setValue,
  images,
  setImages,
}: {
  size: string;
  small?: boolean;
  defaultImage?: string | null;
  index?: number;
  setValue: any;
  images: any;
  setImages: any;
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImage);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.size, file.type);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      console.log('File read as base64, length:', base64.length);

      // Set preview immediately
      setImagePreview(base64);

      // Upload to ImageKit
      setUploading(true);
      try {
        console.log('Starting image upload to ImageKit...');
        toast.loading('Uploading image...', { id: `upload-${index}` });
        const response = await axiosInstance.post('/product/api/upload-product-image', {
          fileName: base64,
        });

        console.log('Image upload response:', response.data);
        toast.success('Image uploaded successfully!', { id: `upload-${index}` });

        const updated = [...images];
        updated[index] = {
          file_url: response.data.file_url,  // Backend expects 'file_url' not 'url'
          fileId: response.data.fileId,
        };

        // Push one more empty slot if this is the last image
        if (index === images.length - 1) {
          updated.push(null);
        }

        // Update preview to use ImageKit URL
        setImagePreview(response.data.file_url);
        setImages(updated);
        setValue('images', updated); // for react-hook-form
      } catch (error: any) {
        toast.error('Failed to upload image: ' + (error.response?.data?.message || 'Unknown error'), {
          id: `upload-${index}`,
        });
        console.error('Image upload error:', error);
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Count valid images (non-null with URLs)
    const validImages = images.filter((img: any) => img !== null && (img?.url || img?.file_url));

    // Must keep at least one image
    if (validImages.length <= 1) {
      toast.error('You must keep at least one image!');
      return;
    }

    // Only delete if this is the latest uploaded image (highest index with image)
    const lastImageIndex = images.reduce((lastIdx: number, img: any, idx: number) => {
      if (img !== null && (img?.url || img?.file_url)) {
        return idx;
      }
      return lastIdx;
    }, -1);

    if (index !== lastImageIndex) {
      toast.error('You can only delete the latest uploaded image!');
      return;
    }

    const currentImage = images[index];
    if (!currentImage) return;

    setDeleting(true);
    try {
      // Delete from ImageKit if it has a fileId
      if (currentImage.fileId) {
        console.log('Deleting image from ImageKit:', currentImage.fileId);
        await axiosInstance.delete('/product/api/delete-product-image', {
          data: { fileId: currentImage.fileId }
        });
        toast.success('Image deleted successfully!');
      }

      // Remove from array
      const updated = [...images];
      updated.splice(index, 1);

      // Clear preview
      setImagePreview(null);
      setImages(updated);
      setValue('images', updated);
    } catch (error: any) {
      console.error('Image deletion error:', error);
      toast.error('Failed to delete image: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`relative ${
        small ? 'h-[180px]' : 'h-[450px]'
      } w-full cursor-pointer bg-[#1e1e1e] border border-gray-600 rounded-lg flex flex-col justify-center items-center`}
    >
      {/* Remove Button - Only show if image exists */}
      {imagePreview && (
        <button
          onClick={handleRemoveImage}
          disabled={deleting}
          className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all disabled:opacity-50"
          title="Remove image (only latest can be removed)"
        >
          <X size={20} />
        </button>
      )}

      <label
        htmlFor={`image-upload-${index}`}
        className="w-full h-full flex flex-col justify-center items-center cursor-pointer"
      >
        {imagePreview ? (
          <>
            <img
              src={imagePreview}
              alt="preview"
              className="w-full h-full object-cover rounded-lg"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <p className="text-white text-sm">Uploading...</p>
              </div>
            )}
            {deleting && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <p className="text-white text-sm">Deleting...</p>
              </div>
            )}
          </>
        ) : (
          <>
            <p
              className={`text-gray-400 ${
                small ? 'text-xl' : 'text-4xl'
              } font-semibold`}
            >
              {size}
            </p>
            <p
              className={`text-gray-500 ${
                small ? 'text-sm' : 'text-lg'
              } pt-2 text-center`}
            >
              Please choose an image <br />
              according to the expected ratio
            </p>
          </>
        )}
      </label>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={`image-upload-${index}`}
        onChange={handleImageChange}
        disabled={uploading}
      />
    </div>
  );
};

export default ImagePlaceHolder;
