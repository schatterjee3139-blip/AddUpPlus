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
        'bg-primary text-primary-foreground hover:bg-primary/90 ' +
        'shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_2px_4px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.12)] ' +
        'hover:shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_4px_8px_rgba(0,0,0,0.18),0_8px_16px_rgba(0,0,0,0.12)] ' +
        'active:shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_1px_2px_rgba(0,0,0,0.2)] active:translate-y-0.5 ' +
        'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 ' +
        'shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_2px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15)] ' +
        'hover:shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_8px_rgba(0,0,0,0.25)] ' +
        'active:shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_1px_2px_rgba(0,0,0,0.25)] active:translate-y-0.5 ' +
        'transition-all duration-200',
      outline:
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-colors duration-200',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 ' +
        'shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset,0_2px_4px_rgba(0,0,0,0.08)] ' +
        'hover:shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset,0_4px_8px_rgba(0,0,0,0.1)] ' +
        'active:shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_1px_2px_rgba(0,0,0,0.1)] active:translate-y-0.5 ' +
        'dark:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_2px_4px_rgba(0,0,0,0.3)] ' +
        'dark:hover:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_4px_8px_rgba(0,0,0,0.35)] ' +
        'transition-all duration-200',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-12 rounded-md px-8 text-base',
      icon: 'h-10 w-10',
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
