import React from 'react';
import { cn, glassCardClasses } from '@/lib/design-system';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn(glassCardClasses, className)} {...props}>
      {children}
    </div>
  );
};
