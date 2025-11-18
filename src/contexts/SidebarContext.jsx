import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rightSidebarWidth');
      return saved ? parseInt(saved, 10) : 320;
    }
    return 320;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rightSidebarWidth', rightSidebarWidth.toString());
    }
  }, [rightSidebarWidth]);

  return (
    <SidebarContext.Provider value={{ rightSidebarWidth, setRightSidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

