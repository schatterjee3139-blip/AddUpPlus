import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const TooltipWrapper = ({ children, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 -top-10 px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-md shadow-md"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


