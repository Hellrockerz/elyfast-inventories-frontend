import React from 'react';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className, ...props }) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src="/logo.png"
      alt="Elyfast Inventories Logo"
      className={className}
      {...props}
    />
  );
};
