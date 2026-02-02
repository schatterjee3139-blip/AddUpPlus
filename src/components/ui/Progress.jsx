import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Progress = forwardRef(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative h-3 w-full overflow-hidden rounded-full bg-secondary/30 shadow-soft',
      className
    )}
    {...props}
  >
    <motion.div
      className="h-full w-full flex-1 bg-gradient-primary shadow-glow transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      initial={{ width: 0 }}
      animate={{ width: `${value || 0}%` }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    />
  </div>
));
Progress.displayName = 'Progress';
