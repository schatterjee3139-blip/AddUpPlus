import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { cn } from '../../lib/utils';

const StyledWrapper = styled.div`
  .input {
    border: none;
    outline: none;
    border-radius: 15px;
    padding: 0.875em 1em;
    background-color: #e8eaed;
    box-shadow: inset 2px 5px 10px rgba(0, 0, 0, 0.15);
    transition: 300ms ease-in-out;
    width: 100%;
    font-size: 0.875rem;
    color: #222;
    font-family: inherit;
    font-weight: 500;

    &::placeholder {
      color: #888;
      font-weight: 400;
    }

    &:focus {
      background-color: #ffffff;
      transform: scale(1.02);
      box-shadow: 
        inset 2px 5px 10px rgba(0, 0, 0, 0.1),
        0 0 20px rgba(59, 130, 246, 0.3),
        13px 13px 50px rgba(200, 200, 200, 0.5),
        -13px -13px 50px rgba(255, 255, 255, 0.8);
    }

    &:hover:not(:focus) {
      background-color: #f0f2f5;
      box-shadow: inset 2px 5px 10px rgba(0, 0, 0, 0.2);
    }

    &:disabled {
      background-color: #e8eaed;
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      background-color: #2d3748;
      color: #e2e8f0;
      box-shadow: inset 2px 5px 10px rgba(0, 0, 0, 0.4);

      &::placeholder {
        color: #a0aec0;
      }

      &:focus {
        background-color: #1a202c;
        box-shadow:
          inset 2px 5px 10px rgba(0, 0, 0, 0.4),
          0 0 20px rgba(59, 130, 246, 0.4),
          13px 13px 50px rgba(50, 50, 50, 0.6),
          -13px -13px 50px rgba(100, 100, 100, 0.3);
      }

      &:hover:not(:focus) {
        background-color: #374151;
        box-shadow: inset 2px 5px 10px rgba(0, 0, 0, 0.5);
      }
    }
  }
`;

export const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <StyledWrapper>
      <input
        ref={ref}
        type={type}
        className={cn('input', className)}
        {...props}
      />
    </StyledWrapper>
  );
});

Input.displayName = 'Input';
