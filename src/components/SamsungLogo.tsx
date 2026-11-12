import React from 'react';

interface SamsungLogoProps {
  className?: string;
  height?: number | string;
  alt?: string;
  variant?: string; // Kept for backwards compatibility
}

export const SamsungLogo: React.FC<SamsungLogoProps> = ({
  className = '',
  height = 32,
  alt = 'Samsung',
}) => {
  return (
    <img
      src="/assets/aistudio/image_429ac626.png"
      alt={alt}
      className={`inline-block object-contain rounded-md transition-transform ${className}`}
      style={{ height }}
    />
  );
};
