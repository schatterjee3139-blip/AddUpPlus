import React, { useState, useEffect, useId, useRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../contexts/ThemeContext';

function useResolvedDark() {
  const { theme } = useTheme();
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);
  return theme === 'dark' || (theme === 'system' && systemDark);
}

const StyledWrapper = styled.div`
  .switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
    outline: none;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #2196f3;
    transition: 0.4s;
    z-index: 0;
    overflow: hidden;
  }

  .sun-moon {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: yellow;
    transition: 0.4s;
  }

  .switch input:checked + .slider {
    background-color: black;
  }

  .switch input:checked + .slider .sun-moon {
    transform: translateX(26px);
    background-color: white;
  }

  /* Only run rolling animation when user toggles (not on mount/page switch) */
  .switch.animate-to-dark input:checked + .slider .sun-moon {
    animation: rotate-center 0.6s ease-in-out both;
  }

  .switch.animate-to-light .slider .sun-moon {
    animation: rotate-center-reverse 0.6s ease-in-out both;
  }

  .moon-dot {
    opacity: 0;
    transition: 0.4s;
    fill: gray;
  }

  .switch input:checked + .slider .sun-moon .moon-dot {
    opacity: 1;
  }

  .slider.round {
    border-radius: 34px;
  }

  .slider.round .sun-moon {
    border-radius: 50%;
  }

  .moon-dot-1 { left: 10px; top: 3px; position: absolute; width: 6px; height: 6px; z-index: 4; }
  .moon-dot-2 { left: 2px; top: 10px; position: absolute; width: 10px; height: 10px; z-index: 4; }
  .moon-dot-3 { left: 16px; top: 18px; position: absolute; width: 3px; height: 3px; z-index: 4; }

  .light-ray-1 { left: -8px; top: -8px; position: absolute; width: 43px; height: 43px; z-index: -1; fill: white; opacity: 0.1; }
  .light-ray-2 { left: -50%; top: -50%; position: absolute; width: 55px; height: 55px; z-index: -1; fill: white; opacity: 0.1; }
  .light-ray-3 { left: -18px; top: -18px; position: absolute; width: 60px; height: 60px; z-index: -1; fill: white; opacity: 0.1; }

  .cloud-light {
    position: absolute;
    fill: #eee;
    animation: cloud-move 6s infinite;
  }

  .cloud-dark {
    position: absolute;
    fill: #ccc;
    animation: cloud-move 6s infinite;
    animation-delay: 1s;
  }

  .cloud-1 { left: 30px; top: 15px; width: 40px; }
  .cloud-2 { left: 44px; top: 10px; width: 20px; }
  .cloud-3 { left: 18px; top: 24px; width: 30px; }
  .cloud-4 { left: 36px; top: 18px; width: 40px; }
  .cloud-5 { left: 48px; top: 14px; width: 20px; }
  .cloud-6 { left: 22px; top: 26px; width: 30px; }

  @keyframes cloud-move {
    0% { transform: translateX(0); }
    40% { transform: translateX(4px); }
    80% { transform: translateX(-4px); }
    100% { transform: translateX(0); }
  }

  .stars {
    transform: translateY(-32px);
    opacity: 0;
    transition: 0.4s;
  }

  .switch input:checked + .slider .stars {
    transform: translateY(0);
    opacity: 1;
  }

  .star {
    fill: white;
    position: absolute;
    transition: 0.4s;
    animation: star-twinkle 2s infinite;
  }

  .star-1 { width: 20px; top: 2px; left: 3px; animation-delay: 0.3s; }
  .star-2 { width: 6px; top: 16px; left: 3px; }
  .star-3 { width: 12px; top: 20px; left: 10px; animation-delay: 0.6s; }
  .star-4 { width: 18px; top: 0; left: 18px; animation-delay: 1.3s; }

  @keyframes star-twinkle {
    0% { transform: scale(1); }
    40% { transform: scale(1.2); }
    80% { transform: scale(0.8); }
    100% { transform: scale(1); }
  }

  @keyframes rotate-center {
    0% { transform: translateX(0) rotate(0); }
    100% { transform: translateX(26px) rotate(360deg); }
  }

  @keyframes rotate-center-reverse {
    0% { transform: translateX(26px) rotate(360deg); }
    100% { transform: translateX(0) rotate(0); }
  }
`;

export function ThemeSwitch({ id: propId, ...props }) {
  const { setTheme } = useTheme();
  const isDark = useResolvedDark();
  const generatedId = useId();
  const inputId = propId || `theme-switch-${generatedId.replace(/:/g, '')}`;
  const [animateToLight, setAnimateToLight] = useState(false);
  const [animateToDark, setAnimateToDark] = useState(false);
  const prevDarkRef = useRef(isDark);

  const handleChange = (e) => {
    const nextDark = e.target.checked;
    if (prevDarkRef.current && !nextDark) {
      setAnimateToLight(true);
    } else if (!prevDarkRef.current && nextDark) {
      setAnimateToDark(true);
    }
    prevDarkRef.current = nextDark;
    setTheme(nextDark ? 'dark' : 'light');
  };

  useEffect(() => {
    prevDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    if (!animateToLight) return;
    const t = setTimeout(() => setAnimateToLight(false), 650);
    return () => clearTimeout(t);
  }, [animateToLight]);

  useEffect(() => {
    if (!animateToDark) return;
    const t = setTimeout(() => setAnimateToDark(false), 650);
    return () => clearTimeout(t);
  }, [animateToDark]);

  const labelClass = ['switch', animateToLight && 'animate-to-light', animateToDark && 'animate-to-dark'].filter(Boolean).join(' ');

  return (
    <StyledWrapper {...props}>
      <label className={labelClass} htmlFor={inputId}>
        <input
          id={inputId}
          type="checkbox"
          checked={isDark}
          onChange={handleChange}
          aria-label="Toggle dark mode"
        />
        <div className="slider round">
          <div className="sun-moon">
            <svg className="moon-dot moon-dot-1" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="moon-dot moon-dot-2" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="moon-dot moon-dot-3" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="light-ray light-ray-1" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="light-ray light-ray-2" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="light-ray light-ray-3" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="cloud-dark cloud-1" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="cloud-dark cloud-2" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="cloud-dark cloud-3" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="cloud-light cloud-4" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="cloud-light cloud-5" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
            <svg className="cloud-light cloud-6" viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={50} />
            </svg>
          </div>
          <div className="stars">
            <svg className="star star-1" viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
            <svg className="star star-2" viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
            <svg className="star star-3" viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
            <svg className="star star-4" viewBox="0 0 20 20">
              <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z" />
            </svg>
          </div>
        </div>
      </label>
    </StyledWrapper>
  );
}

export default ThemeSwitch;
