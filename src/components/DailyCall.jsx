import React, { useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

export const DailyCall = ({ roomUrl }) => {
  const containerRef = useRef(null);
  const callFrameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !roomUrl) return;

    // Create the Daily call frame
    const callFrame = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '12px',
      },
    });

    callFrameRef.current = callFrame;

    // Join the call
    callFrame.join({ url: roomUrl }).catch((error) => {
      console.error('Error joining Daily call:', error);
    });

    // Cleanup on unmount
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [roomUrl]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[600px] rounded-lg overflow-hidden bg-muted/30"
    />
  );
};

