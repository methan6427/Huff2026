/**
 * main.tsx
 *
 * Vite entry point. Mounts the React application into the #root div.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
