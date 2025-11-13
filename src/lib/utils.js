// Utility function to merge Tailwind classes, similar to shadcn/ui
export const cn = (...inputs) => {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ');
};


