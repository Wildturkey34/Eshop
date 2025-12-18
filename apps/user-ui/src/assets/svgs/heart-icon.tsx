import React from 'react';

type HeartIconProps = {
  size?: number;
  color?: string;
};

const HeartIcon: React.FC<HeartIconProps> = ({
  size = 24,
  color = 'currentColor',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    {/* Main heart */}
    <path
      d="M12 21s-6.5-4.4-9.3-8.6C.6 8.6 2.4 4 6.5 4c2.2 0 3.6 1.2 4.4 2.3c.8-1.1 2.2-2.3 4.4-2.3c4.1 0 5.9 4.6 3.8 8.4C18.5 16.6 12 21 12 21z"
      fill={color}
    />
    {/* Right-side highlight */}
    <path
      d="M15.5 7.5c1 .7 1.5 1.6 1.5 2.8c0 1.9-1.6 3.6-3.2 5.1c-.2.2-.4.2-.6 0c1-1.5 2.3-3 2.3-5.1c0-.6-.1-1.3-.6-1.9c-.1-.1 0-.3.2-.3h.4z"
      fill="white"
      fillOpacity={0.5}
    />
  </svg>
);

export default HeartIcon;
