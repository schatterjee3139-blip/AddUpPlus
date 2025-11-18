import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const DesmosCalculator = ({ isOpen, onClose, initialExpression = null, embedded = false }) => {
  const calculatorRef = useRef(null);
  const calculatorInstanceRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);
  const hasInitializedRef = useRef(false);

  const initializeCalculator = useCallback(() => {
    // Don't initialize if already initialized and calculator exists
    if (calculatorInstanceRef.current || hasInitializedRef.current) {
      console.log('Calculator already initialized, skipping...');
      setIsLoading(false);
      return;
    }

    if (!calculatorRef.current) {
      console.log('Calculator ref not ready');
      return;
    }

    if (!window.Desmos) {
      console.log('Desmos API not loaded yet');
      return;
    }

    if (!isOpen) {
      console.log('Calculator not open');
      return;
    }

    // Check if container has dimensions and is visible
    const rect = calculatorRef.current.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0 && 
                     calculatorRef.current.offsetParent !== null;
    
    if (!isVisible) {
      console.log('Calculator container not visible or has no dimensions:', {
        width: rect.width,
        height: rect.height,
        offsetParent: calculatorRef.current.offsetParent
      });
      // Retry after a short delay
      setTimeout(() => {
        if (isOpen && !hasInitializedRef.current) {
          initializeCalculator();
        }
      }, 500);
      return;
    }

    // Create new calculator instance
    try {
      console.log('Initializing Desmos calculator with dimensions:', rect.width, 'x', rect.height);
      
      // Ensure the container is visible and has content
      if (calculatorRef.current) {
        calculatorRef.current.style.display = 'block';
        calculatorRef.current.style.visibility = 'visible';
      }
      
      calculatorInstanceRef.current = window.Desmos.GraphingCalculator(calculatorRef.current, {
        expressions: true,
        keypad: true,
        zoomButtons: true,
        settingsMenu: true,
        lockViewport: false,
        border: false,
      });

      // Force a resize after creation to ensure it renders
      setTimeout(() => {
        if (calculatorInstanceRef.current && calculatorRef.current) {
          try {
            calculatorInstanceRef.current.resize();
            console.log('Calculator resized after initialization');
          } catch (e) {
            console.warn('Error resizing calculator:', e);
          }
        }
      }, 100);

      // Set initial expression if provided
      if (initialExpression) {
        calculatorInstanceRef.current.setExpression({
          id: 'initial',
          latex: initialExpression,
        });
      }
      
      console.log('Desmos calculator initialized successfully');
      hasInitializedRef.current = true;
      
      // Verify calculator is actually there
      setTimeout(() => {
        if (calculatorInstanceRef.current) {
          console.log('Calculator instance still exists, hiding loading...');
          setIsLoading(false);
          
          // Double check the calculator is visible
          if (calculatorRef.current) {
            const rect = calculatorRef.current.getBoundingClientRect();
            console.log('Calculator container dimensions after init:', rect.width, 'x', rect.height);
            
            // Force another resize if needed
            if (rect.width > 0 && rect.height > 0) {
              try {
                calculatorInstanceRef.current.resize();
              } catch (e) {
                console.warn('Error on final resize:', e);
              }
            }
          }
        } else {
          console.error('Calculator instance was destroyed after initialization!');
          setIsLoading(false);
        }
      }, 500);
    } catch (error) {
      console.error('Error initializing Desmos calculator:', error);
      setIsLoading(false);
    }
  }, [isOpen, initialExpression]);

  useEffect(() => {
    if (!isOpen) {
      // Cleanup when closed
      setIsLoading(true);
      if (calculatorInstanceRef.current) {
        try {
          calculatorInstanceRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying calculator on close:', e);
        }
        calculatorInstanceRef.current = null;
      }
      return;
    }

    // Reset loading state when opening
    setIsLoading(true);

    // Load Desmos API script if not already loaded
    if (!window.Desmos) {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="desmos.com/api"]');
      if (existingScript) {
        console.log('Desmos script already in DOM, waiting for load...');
        const checkInterval = setInterval(() => {
          if (window.Desmos) {
            clearInterval(checkInterval);
            setTimeout(() => {
              initializeCalculator();
            }, 300);
          }
        }, 100);
        
        return () => {
          clearInterval(checkInterval);
        };
      } else {
        console.log('Loading Desmos API script...');
        const script = document.createElement('script');
        script.src = 'https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
        script.async = true;
        script.onload = () => {
          console.log('Desmos API script loaded');
          // Wait a bit for DOM to be ready
          setTimeout(() => {
            initializeCalculator();
          }, 300);
        };
        script.onerror = () => {
          console.error('Failed to load Desmos API script');
          setIsLoading(false);
        };
        document.head.appendChild(script);
      }
    } else {
      // API already loaded, wait for DOM to be ready
      console.log('Desmos API already loaded, initializing...');
      const timer = setTimeout(() => {
        initializeCalculator();
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }

    // No cleanup here - we only cleanup when isOpen becomes false
  }, [isOpen, initializeCalculator]);

  // Separate effect for cleanup when closing
  useEffect(() => {
    if (!isOpen && calculatorInstanceRef.current) {
      console.log('Cleaning up calculator on close');
      try {
        calculatorInstanceRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying calculator:', e);
      }
      calculatorInstanceRef.current = null;
      hasInitializedRef.current = false;
      setIsLoading(true);
    }
  }, [isOpen]);

  // Resize observer to handle container size changes
  useEffect(() => {
    if (!isOpen || !calculatorRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (calculatorInstanceRef.current && calculatorRef.current) {
        const entry = entries[0];
        if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          try {
            calculatorInstanceRef.current.resize();
            console.log('Calculator resized via ResizeObserver to:', entry.contentRect.width, 'x', entry.contentRect.height);
          } catch (e) {
            console.warn('Error resizing calculator:', e);
          }
        }
      }
    });

    if (calculatorRef.current) {
      resizeObserver.observe(calculatorRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!isOpen) return null;

  // Embedded mode (for sidebar)
  if (embedded) {
    return (
      <div className="w-full h-full flex flex-col" style={{ height: '100%', width: '100%', minHeight: 0, position: 'relative' }}>
        {/* Calculator Container */}
        <div 
          className="flex-1 relative" 
          style={{ 
            minHeight: 0, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            height: '100%',
            width: '100%'
          }}
        >
          <div
            ref={calculatorRef}
            style={{ 
              width: '100%', 
              height: '100%',
              minHeight: '400px',
              minWidth: '280px',
              flex: '1 1 auto',
              position: 'relative',
              display: 'block',
              visibility: 'visible',
              overflow: 'hidden',
              backgroundColor: 'transparent'
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 pointer-events-none">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Loading calculator...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with tips */}
        <div className="p-2 border-t border-border/50 bg-muted/5 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Tip: Type expressions like <code className="px-1 py-0.5 rounded bg-muted text-foreground">y=x^2</code> or{' '}
            <code className="px-1 py-0.5 rounded bg-muted text-foreground">sin(x)</code> to graph functions
          </p>
        </div>
      </div>
    );
  }

  // Modal mode (full screen overlay)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <Card
        ref={containerRef}
        className={`relative bg-background shadow-2xl overflow-hidden flex flex-col ${
          isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[80vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Desmos Graphing Calculator</h2>
            <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-primary/10 text-primary">
              Interactive
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calculator Container */}
        <div className="flex-1 relative bg-background">
          <div
            ref={calculatorRef}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Footer with tips */}
        <div className="p-3 border-t border-border/50 bg-muted/5">
          <p className="text-xs text-muted-foreground text-center">
            Tip: Type expressions like <code className="px-1 py-0.5 rounded bg-muted text-foreground">y=x^2</code> or{' '}
            <code className="px-1 py-0.5 rounded bg-muted text-foreground">sin(x)</code> to graph functions
          </p>
        </div>
      </Card>
    </div>
  );
};

