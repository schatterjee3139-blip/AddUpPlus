import React from 'react';

export const WherebyCall = ({ roomUrl }) => {
  return (
    <iframe
      src={roomUrl}
      allow="camera; microphone; fullscreen; speaker; display-capture"
      style={{
        width: '100%',
        height: '600px',
        border: '0',
        borderRadius: '12px',
      }}
      title="Whereby Video Call"
    />
  );
};

