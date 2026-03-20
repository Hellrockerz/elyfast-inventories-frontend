import React from 'react';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className, ...props }) => {
  return (
    <img 
      src="/logo.png"
      alt="Elyfast Inventories Logo"
      className={className}
      {...props}
    />
  );
};
