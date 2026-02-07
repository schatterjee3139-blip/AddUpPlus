import styled from 'styled-components';

export const AuthFormWrapper = styled.div`
  .auth-form {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 1.5em 2em 0.4em 2em;
    max-width: 28rem;
    width: 100%;
    background-color: #171717;
    border-radius: 25px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    /* 3D: layered shadow + top highlight */
    box-shadow:
      0 1px 0 0 rgba(255, 255, 255, 0.06) inset,
      0 4px 12px rgba(0, 0, 0, 0.25),
      0 12px 28px rgba(0, 0, 0, 0.2),
      0 24px 48px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    overflow: hidden;
  }

  .auth-form::before {
    content: '';
    position: absolute;
    inset: 0;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
    pointer-events: none;
    border-radius: 25px 25px 0 0;
  }

  .auth-form:hover {
    transform: scale(1.04) translateY(-6px);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow:
      0 1px 0 0 rgba(255, 255, 255, 0.08) inset,
      0 8px 24px rgba(0, 0, 0, 0.35),
      0 20px 44px rgba(0, 0, 0, 0.28),
      0 36px 72px rgba(0, 0, 0, 0.2);
  }

  /* Keep card height stable when switching role/tutor vs form */
  .auth-form-content {
    min-height: 320px;
  }

  .auth-heading {
    text-align: center;
    margin: 1em 0 0.5em;
    color: rgb(255, 255, 255);
    font-size: 1.5em;
    font-weight: 700;
  }

  .auth-subheading {
    text-align: center;
    margin: 0 0 1em;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9em;
  }

  .auth-field {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    border-radius: 25px;
    padding: 0.6em 1em;
    border: none;
    outline: none;
    color: white;
    background-color: #171717;
    box-shadow: inset 2px 5px 10px rgb(5, 5, 5);
  }

  .auth-input-icon {
    height: 1.3em;
    width: 1.3em;
    flex-shrink: 0;
    fill: white;
  }

  .auth-input-field {
    background: none;
    border: none;
    outline: none;
    width: 100%;
    color: #d3d3d3;
    font-size: 1rem;
  }

  .auth-input-field::placeholder {
    color: rgba(211, 211, 211, 0.5);
  }

  .auth-role-label {
    font-size: 0.9em;
    font-weight: 600;
    color: rgb(255, 255, 255);
    margin-bottom: 0.5em;
    display: block;
  }

  .auth-role-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75em;
    margin-bottom: 1em;
  }

  .auth-role-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25em;
    min-height: 80px;
    padding: 1em 0.75em;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background-color: #252525;
    color: white;
    cursor: pointer;
    transition: 0.3s ease;
  }

  .auth-role-btn:hover {
    background-color: #1a1a1a;
    border-color: rgba(255, 255, 255, 0.25);
  }

  .auth-role-btn.active {
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.15);
  }

  .auth-role-btn svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .auth-btn-row {
    display: flex;
    justify-content: center;
    flex-direction: row;
    gap: 0.5em;
    margin-top: 1.5em;
    flex-wrap: wrap;
  }

  .auth-btn-primary {
    padding: 0.5em 1.1em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: 0.4s ease-in-out;
    background-color: #252525;
    color: white;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .auth-btn-primary:hover:not(:disabled) {
    background-color: black;
    color: white;
  }

  .auth-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-btn-secondary {
    padding: 0.5em 1.5em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: 0.4s ease-in-out;
    background-color: #252525;
    color: white;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .auth-btn-secondary:hover:not(:disabled) {
    background-color: black;
    color: white;
  }

  .auth-btn-link {
    margin-bottom: 1em;
    padding: 0.5em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: 0.4s ease-in-out;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    font-size: 0.9rem;
  }

  .auth-btn-link:hover {
    color: #ef4444;
  }

  .auth-divider {
    margin: 1.25em 0;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .auth-oauth-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5em;
  }

  .auth-oauth-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    padding: 0.5em 1em;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: #252525;
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
    transition: 0.3s ease;
  }

  .auth-oauth-btn:hover:not(:disabled) {
    background-color: black;
  }

  .auth-oauth-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-error {
    border-radius: 10px;
    padding: 0.75em 1em;
    background-color: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    font-size: 0.9rem;
    margin-top: 0.5em;
  }

  .auth-tutor-list {
    margin: 1em 0;
    min-height: 200px;
  }

  .auth-tutor-item {
    width: 100%;
    padding: 0.75em 1em;
    margin-bottom: 0.5em;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background-color: #252525;
    color: white;
    text-align: left;
    cursor: pointer;
    transition: 0.3s ease;
  }

  .auth-tutor-item:hover {
    background-color: #1a1a1a;
    border-color: rgba(59, 130, 246, 0.4);
  }

  .auth-tutor-name {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .auth-tutor-subject {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 0.2em;
  }

  .auth-back-btn {
    width: 100%;
    margin-top: 0.5em;
    padding: 0.5em;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    font-size: 0.9rem;
    text-align: center;
  }

  .auth-back-btn:hover {
    color: white;
  }

  .auth-selected-tutor {
    padding: 0.75em 1em;
    margin-bottom: 1em;
    border-radius: 15px;
    background-color: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: white;
  }

  .auth-name-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5em;
    margin-bottom: 0.5em;
  }

  @keyframes auth-spin {
    to { transform: rotate(360deg); }
  }
  .auth-spin {
    display: inline-block;
    animation: auth-spin 0.8s linear infinite;
    margin-right: 0.5rem;
    vertical-align: middle;
  }
`;
