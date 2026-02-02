import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Textarea = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[120px] w-full rounded-lg border border-input/40 bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-soft hover:border-primary/30 hover:shadow-medium resize-none',
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
