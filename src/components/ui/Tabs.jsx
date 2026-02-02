import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Tabs = ({ className, value, onValueChange, ...props }) => (
  <div className={cn('w-full', className)} {...props} />
);

export const TabsList = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex h-11 items-center justify-center rounded-lg bg-muted/50 p-1.5 text-muted-foreground border border-border/40 shadow-soft',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef(
  ({ className, isActive, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-foreground/80',
        isActive
          ? 'bg-background text-foreground shadow-medium'
          : 'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-medium',
        className
      )}
      {...props}
    />
  )
);
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
