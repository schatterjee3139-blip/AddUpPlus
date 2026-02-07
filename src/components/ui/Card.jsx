import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * Glass card: no preset gradient. Uses backdrop-blur so it reveals the shared
 * page-level gradient behind it. Subtle 3D shine (top-edge highlight, shadow).
 */
export const Card = forwardRef(({ className, ...props }, ref) => {
  const { children, ...otherProps } = props;

  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-2xl overflow-hidden text-card-foreground transition-all duration-300',
        'backdrop-blur-xl',
        'bg-white/60 dark:bg-white/[0.06]',
        'border border-white/50 dark:border-white/10',
        /* Layered 3D shadow: soft lift + contact shadow + subtle rim */
        'shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_2px_4px_rgba(0,0,0,0.04),0_6px_12px_rgba(0,0,0,0.06),0_12px_24px_rgba(0,0,0,0.04)]',
        'dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_2px_4px_rgba(0,0,0,0.2),0_8px_16px_rgba(0,0,0,0.25),0_16px_32px_rgba(0,0,0,0.2)]',
        'hover:shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset,0_4px_8px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.08),0_20px_40px_rgba(0,0,0,0.06)]',
        'dark:hover:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_4px_8px_rgba(0,0,0,0.25),0_14px_28px_rgba(0,0,0,0.35),0_24px_48px_rgba(0,0,0,0.25)]',
        className
      )}
      {...otherProps}
    >
      {/* Subtle top/left edge highlight — light touch only */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-px bg-gradient-to-b from-white/25 via-white/10 to-transparent dark:from-white/10 dark:via-transparent dark:to-transparent"
        aria-hidden
      />
      {/* Bottom-right hint of depth (light from top-left) */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-10 w-10 bg-gradient-to-tl from-black/[0.035] to-transparent dark:from-black/25 rounded-tl-2xl"
        aria-hidden
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});
Card.displayName = 'Card';

export const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 p-6 pb-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(({ className, as: Comp = 'h3', ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn('text-2xl font-bold leading-tight tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef(
  ({ className, as: Comp = 'p', ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-2', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-2', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';
