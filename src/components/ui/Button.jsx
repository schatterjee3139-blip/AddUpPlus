import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Button = forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? 'span' : 'button';
    const variants = {
      default:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-medium hover:shadow-elevated hover:scale-105 active:scale-95',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-medium hover:shadow-elevated',
      outline:
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-colors duration-200',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-medium hover:shadow-elevated',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };
    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-9 w-9',
    };
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
