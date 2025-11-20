import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Avatar = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

export const AvatarImage = forwardRef(({ className, crossOrigin, src, ...props }, ref) => {
  // Only set crossOrigin for external URLs (like Google profile images)
  // Same-origin images don't need it and it can cause issues
  const isExternalUrl = src && (src.startsWith('http://') || src.startsWith('https://'));
  const shouldUseCrossOrigin = crossOrigin !== undefined 
    ? crossOrigin 
    : (isExternalUrl ? 'anonymous' : undefined);
  
  return (
    <img
      ref={ref}
      className={cn('aspect-square h-full w-full', className)}
      crossOrigin={shouldUseCrossOrigin}
      src={src}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';


