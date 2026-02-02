import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Card = forwardRef(({ className, ...props }, ref) => {
  const { children, ...otherProps } = props;

  return (
    <div
      ref={ref}
      className={cn(
        'relative border border-white/40 dark:border-white/20 rounded-2xl overflow-hidden text-card-foreground transition-all duration-300 group',
        className
      )}
      {...otherProps}
    >
      {/* Gradient border background */}
      <div className="w-full h-full p-1 absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-80 dark:opacity-60 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-full h-full rounded-[20px] rounded-tr-[80px] rounded-br-[40px] bg-background dark:bg-slate-900" />
      </div>

      {/* Glass morphism overlay */}
      <div className="w-full h-full absolute inset-0 backdrop-blur-xl rounded-2xl" />

      {/* Floating gradient orb animation */}
      <div className="w-full h-full absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none">
        <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-primary to-accent blur-3xl animate-spin" style={{animationDuration: '20s'}} />
      </div>

      {/* Content container */}
      <div className="w-full h-full relative z-10">
        {children}
      </div>
    </div>
  );
});
Card.displayName = 'Card';

export const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(({ className, as: Comp = 'h3', ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn(
      'text-2xl font-bold leading-tight tracking-tight',
      className
    )}
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
  <div ref={ref} className={cn('p-6 pt-4', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
