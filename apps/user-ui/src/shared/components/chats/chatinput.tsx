import { PickerProps } from 'emoji-picker-react';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { Send, ImageIcon, Smile, Loader2 } from 'lucide-react';
import axiosInstance from '../../../utils/axiosInstance';
import { toast } from 'sonner';

const EmojiPicker = dynamic(
  () =>
    import('emoji-picker-react').then(
      (mod) => mod.default as React.FC<PickerProps>
    ),
  {
    ssr: false,
  }
);

const ChatInput = ({
  onSendMessage,
  message,
  setMessage,
}: {
  onSendMessage: (e: any, attachments?: string[]) => void;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = async () => {
          const base64Image = reader.result;
          const response = await axiosInstance.post(
            '/chatting/api/upload-chat-image',
            { fileName: base64Image }
          );

          if (response.data.success) {
            onSendMessage(null, [response.data.url]);
          }
        };

        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Failed to upload image:', err);
        toast.error('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <form
      onSubmit={onSendMessage}
      className="border-t border-t-gray-200 bg-white px-4 py-3 flex items-center gap-2 relative"
    >
      {/* Upload Icon */}
      <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-md">
        {isUploading ? (
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        ) : (
          <ImageIcon className="w-5 h-5 text-gray-600" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isUploading}
          hidden
        />
      </label>

      {/* Emoji Picker Toggle */}
      <div className="relative">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => setShowEmoji((prev) => !prev)}
          className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50"
        >
          <Smile className="w-5 h-5 text-gray-600" />
        </button>
        {showEmoji && (
          <div className="absolute bottom-12 left-0 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      <input
        type="text"
        value={message}
        disabled={isUploading}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={isUploading ? 'Uploading image...' : 'Type your message...'}
        className="flex-1 px-4 py-2 text-sm border outline-none border-gray-200 rounded-md disabled:bg-gray-50"
      />
      {/* Send Button */}
      <button
        type="submit"
        disabled={isUploading || (!message.trim())}
        className="bg-blue-600 hover:bg-blue-700 transition text-white p-2 rounded-md disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};

export default ChatInput;
