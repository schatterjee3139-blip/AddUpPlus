import React from 'react';
import styled from 'styled-components';
import { Loader2 } from 'lucide-react';

const SPARKLE_SVG = (
  <svg className="sparkle" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PARTICLE_SVG = (
  <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.937 3.846L7.75 1L8.563 3.846C8.77313 4.58114 9.1671 5.25062 9.70774 5.79126C10.2484 6.3319 10.9179 6.72587 11.653 6.936L14.5 7.75L11.654 8.563C10.9189 8.77313 10.2494 9.1671 9.70874 9.70774C9.1681 10.2484 8.77413 10.9179 8.564 11.653L7.75 14.5L6.937 11.654C6.72687 10.9189 6.3329 10.2494 5.79226 9.70874C5.25162 9.1681 4.58214 8.77413 3.847 8.564L1 7.75L3.846 6.937C4.58114 6.72687 5.25062 6.3329 5.79126 5.79226C6.3319 5.25162 6.72587 4.58214 6.936 3.847L6.937 3.846Z" fill="currentColor" stroke="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const particleCount = 16;

export function SparkleButton({ children = 'Generate', loading, disabled, className, ...props }) {
  return (
    <StyledWrapper className={className} style={{ '--active': disabled ? 0 : undefined }}>
      <div className="sp">
        <button type="button" className={`sparkle-button ${loading ? 'loading' : ''}`} disabled={disabled} {...props}>
          <span className="spark" />
          <span className="backdrop" />
          {SPARKLE_SVG}
          <span className="text">
            {loading ? (
              <>
                <Loader2 className="inline h-[1em] w-[1em] mr-1.5 animate-spin" style={{ verticalAlign: 'middle' }} />
                Generating...
              </>
            ) : (
              children
            )}
          </span>
        </button>
        <div className="bodydrop" />
        <span aria-hidden="true" className="particle-pen">
          {Array.from({ length: particleCount }, (_, i) => (
            <span key={i} className="particle" />
          ))}
        </span>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  --transition: 0.3s;
  --spark: 2s;
  --cut: 2px;
  --play-state: paused;

  .sparkle-button {
    --active: 0;
    --bg: radial-gradient(
        40% 50% at center 100%,
        hsl(270 calc(var(--active) * 97%) 72% / var(--active)),
        transparent
      ),
      radial-gradient(
        80% 100% at center 120%,
        hsl(260 calc(var(--active) * 97%) 70% / var(--active)),
        transparent
      ),
      hsl(260 calc(var(--active) * 97%) calc((var(--active) * 44%) + 12%));
    background: var(--bg);
    font-size: 1rem;
    font-weight: 500;
    border: 0;
    cursor: pointer;
    padding: 0.75em 1.25em;
    display: flex;
    align-items: center;
    gap: 0.35em;
    white-space: nowrap;
    border-radius: 100px;
    position: relative;
    box-shadow:
      0 0 calc(var(--active) * 3em) calc(var(--active) * 1em) hsl(260 97% 61% / 0.5),
      0 0em 0 0 hsl(260 calc(var(--active) * 97%) calc((var(--active) * 50%) + 30%)) inset,
      0 -0.05em 0 0 hsl(260 calc(var(--active) * 97%) calc(var(--active) * 60%)) inset;
    transition: box-shadow var(--transition), scale var(--transition), background var(--transition);
    scale: calc(1 + (var(--active) * 0.08));
  }

  .sparkle-button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .sparkle-button:active:not(:disabled) {
    scale: 1;
  }

  .sparkle {
    inline-size: 1.2em;
    translate: -15% -5%;
  }

  .sparkle path {
    color: hsl(0 0% calc((var(--active, 0) * 70%) + 40%));
    transform-box: fill-box;
    transform-origin: center;
    fill: currentColor;
    stroke: currentColor;
    animation-delay: calc((var(--transition) * 1.5) + (var(--delay) * 1s));
    animation-duration: 0.6s;
    transition: color var(--transition);
  }

  .sparkle-button:is(:hover, :focus-visible):not(:disabled) path {
    animation-name: sparkle-bounce;
  }

  @keyframes sparkle-bounce {
    35%,
    65% {
      transform: scale(var(--scale, 1));
    }
  }

  .sparkle path:nth-of-type(1) {
    --scale: 0.5;
    --delay: 0.1;
  }

  .sparkle path:nth-of-type(2) {
    --scale: 1.5;
    --delay: 0.2;
  }

  .sparkle path:nth-of-type(3) {
    --scale: 2.5;
    --delay: 0.35;
  }

  .sparkle-button::before {
    content: '';
    position: absolute;
    inset: -0.2em;
    z-index: -1;
    border: 0.2em solid hsl(260 97% 50% / 0.5);
    border-radius: 100px;
    opacity: var(--active, 0);
    transition: opacity var(--transition);
  }

  .spark {
    position: absolute;
    inset: 0;
    border-radius: 100px;
    overflow: hidden;
    /* Reveal only a horizontal band (no diagonal) */
    mask: linear-gradient(to bottom, transparent 25%, white 35%, white 65%, transparent 75%);
    -webkit-mask: linear-gradient(to bottom, transparent 25%, white 35%, white 65%, transparent 75%);
    opacity: var(--active, 0);
    pointer-events: none;
    transition: opacity var(--transition);
  }

  .spark::before {
    content: '';
    position: absolute;
    /* Horizontal band: wide, short — sweeps left to right */
    width: 60%;
    height: 100%;
    top: 0;
    left: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.25) 25%,
      rgba(255, 255, 255, 0.6) 50%,
      rgba(255, 255, 255, 0.25) 75%,
      transparent 100%
    );
    animation: spark-sweep-horizontal var(--spark) ease-in-out infinite;
  }

  .spark::after {
    content: '';
    position: absolute;
    inset: var(--cut);
    border-radius: 100px;
    background: hsl(260 calc(var(--active) * 97%) calc((var(--active) * 44%) + 12%));
  }

  .backdrop {
    position: absolute;
    inset: var(--cut);
    background: var(--bg);
    border-radius: 100px;
    transition: background var(--transition);
  }

  @keyframes spark-sweep-horizontal {
    0% {
      transform: translateX(-120%);
    }
    100% {
      transform: translateX(220%);
    }
  }

  .sparkle-button:is(:hover, :focus-visible):not(:disabled) {
    --active: 1;
    --play-state: running;
  }

  .sparkle-button:is(:hover, :focus-visible):not(:disabled) ~ .bodydrop,
  .sparkle-button:is(:hover, :focus-visible):not(:disabled) ~ .particle-pen {
    --active: 1;
    --play-state: running;
  }

  .sp {
    position: relative;
    display: inline-block;
  }

  &.w-full .sp {
    display: block;
    width: 100%;
  }

  &.w-full .sparkle-button {
    width: 100%;
    justify-content: center;
  }

  .particle-pen {
    position: absolute;
    width: 200%;
    aspect-ratio: 1;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    -webkit-mask: radial-gradient(white, transparent 65%);
    mask: radial-gradient(white, transparent 65%);
    z-index: -1;
    opacity: var(--active, 0);
    transition: opacity var(--transition);
    pointer-events: none;
  }

  .particle {
    display: block;
    width: 0.35rem;
    aspect-ratio: 1;
    position: absolute;
    top: calc(var(--y, 50) * 1%);
    left: calc(var(--x, 50) * 1%);
    opacity: var(--alpha, 0.8);
    animation: particle-float calc(var(--duration, 1) * 1s) calc(var(--delay, 0) * -1s) infinite linear;
    transform-origin: var(--origin-x, 50%) var(--origin-y, 50%);
    z-index: -1;
    animation-play-state: var(--play-state, paused);
    background: radial-gradient(circle, hsl(0 0% 90%) 0%, transparent 70%);
    border-radius: 50%;
  }

  .particle:nth-of-type(1) { --x: 20; --y: 30; --delay: 0; --duration: 1.2; }
  .particle:nth-of-type(2) { --x: 80; --y: 25; --delay: 0.1; --duration: 1.4; }
  .particle:nth-of-type(3) { --x: 50; --y: 80; --delay: 0.2; --duration: 1.1; }
  .particle:nth-of-type(4) { --x: 15; --y: 70; --delay: 0.15; --duration: 1.3; }
  .particle:nth-of-type(5) { --x: 85; --y: 65; --delay: 0.25; --duration: 1.5; }
  .particle:nth-of-type(6) { --x: 40; --y: 15; --delay: 0.05; --duration: 1.25; }
  .particle:nth-of-type(7) { --x: 60; --y: 85; --delay: 0.3; --duration: 1.35; }
  .particle:nth-of-type(8) { --x: 30; --y: 50; --delay: 0.12; --duration: 1.2; }
  .particle:nth-of-type(9) { --x: 70; --y: 45; --delay: 0.18; --duration: 1.4; }
  .particle:nth-of-type(10) { --x: 10; --y: 50; --delay: 0.22; --duration: 1.15; }
  .particle:nth-of-type(11) { --x: 90; --y: 55; --delay: 0.08; --duration: 1.45; }
  .particle:nth-of-type(12) { --x: 50; --y: 20; --delay: 0.28; --duration: 1.3; }
  .particle:nth-of-type(13) { --x: 25; --y: 85; --delay: 0.02; --duration: 1.2; }
  .particle:nth-of-type(14) { --x: 75; --y: 15; --delay: 0.2; --duration: 1.5; }
  .particle:nth-of-type(15) { --x: 45; --y: 60; --delay: 0.14; --duration: 1.25; }
  .particle:nth-of-type(16) { --x: 55; --y: 35; --delay: 0.26; --duration: 1.35; }

  .particle:nth-of-type(even) {
    animation-direction: reverse;
  }

  @keyframes particle-float {
    to {
      transform: rotate(360deg);
    }
  }

  .text {
    display: inline-flex;
    align-items: center;
    gap: 0.35em;
    translate: 2% -6%;
    letter-spacing: 0.01ch;
    background: linear-gradient(
      90deg,
      hsl(0 0% calc((var(--active) * 100%) + 65%)),
      hsl(0 0% calc((var(--active) * 100%) + 26%))
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    transition: background var(--transition);
  }

  .sparkle-button.loading .text {
    color: hsl(0 0% 30%);
    background: none;
    -webkit-background-clip: unset;
    background-clip: unset;
  }

  .dark .sparkle-button.loading .text {
    color: hsl(0 0% 75%);
  }
`;
