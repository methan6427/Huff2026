/**
 * App.tsx
 *
 * Root component. Provides two routes:
 *   /      → main interface with Compress / Decompress tabs
 *   /mini  → simplified drag-and-drop interface (file-explorer integration)
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CompressTab } from './components/CompressTab';
import { DecompressTab } from './components/DecompressTab';
import { Mini } from './pages/Mini';

type ActiveTab = 'compress' | 'decompress';

/**
 * MainLayout
 *
 * The primary application shell with a header, tab bar, and tab content area.
 */
function MainLayout() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('compress');

  return (
    <div className="app-shell">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo">
            {/* Geometric SVG mark that resembles a Huffman tree branch */}
            <svg className="logo-mark" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="8"  r="3" fill="var(--accent-primary)" />
              <circle cx="10" cy="24" r="3" fill="var(--accent-primary)" opacity="0.7" />
              <circle cx="30" cy="24" r="3" fill="var(--accent-primary)" opacity="0.7" />
              <circle cx="5"  cy="36" r="3" fill="var(--accent-primary)" opacity="0.4" />
              <circle cx="15" cy="36" r="3" fill="var(--accent-primary)" opacity="0.4" />
              <circle cx="25" cy="36" r="3" fill="var(--accent-primary)" opacity="0.4" />
              <circle cx="35" cy="36" r="3" fill="var(--accent-primary)" opacity="0.4" />
              <line x1="20" y1="8"  x2="10" y2="24" stroke="var(--accent-primary)" strokeWidth="1" opacity="0.5"/>
              <line x1="20" y1="8"  x2="30" y2="24" stroke="var(--accent-primary)" strokeWidth="1" opacity="0.5"/>
              <line x1="10" y1="24" x2="5"  y2="36" stroke="var(--accent-primary)" strokeWidth="1" opacity="0.3"/>
              <line x1="10" y1="24" x2="15" y2="36" stroke="var(--accent-primary)" strokeWidth="1" opacity="0.3"/>
              <line x1="30" y1="24" x2="25" y2="36" stroke="var(--accent-primary)" strokeWidth="1" opacity="0.3"/>
              <line x1="30" y1="24" x2="35" y2="36" stroke="var(--accent-primary)" strokeWidth="1" opacity="0.3"/>
            </svg>
            <div className="app-title-group">
              <h1 className="app-title">HUFFMAN CODER</h1>
              <p className="app-subtitle">COM336 · Design &amp; Analysis of Algorithms · Birzeit University</p>
            </div>
          </div>

          {/* Mini interface link */}
          <a href="/mini" className="mini-link" title="Simplified drag-and-drop interface">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
            </svg>
            QUICK MODE
          </a>
        </div>

        {/* Thin accent line beneath the header */}
        <div className="header-line" />
      </header>

      {/* ── Tab Bar ───────────────────────────────────────────────────── */}
      <nav className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'compress' ? 'active' : ''}`}
          onClick={() => setActiveTab('compress')}
        >
          <span className="tab-indicator">[</span>
          <span className="tab-icon">▼</span>
          COMPRESS
          <span className="tab-indicator">]</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'decompress' ? 'active' : ''}`}
          onClick={() => setActiveTab('decompress')}
        >
          <span className="tab-indicator">[</span>
          <span className="tab-icon">▲</span>
          DECOMPRESS
          <span className="tab-indicator">]</span>
        </button>
      </nav>

      {/* ── Content Area ──────────────────────────────────────────────── */}
      <main className="app-main">
        {activeTab === 'compress'   ? <CompressTab />   : <DecompressTab />}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <span>Huffman Coding · O(n log n) · PostOrder serialisation · Stack-based decode</span>
      </footer>
    </div>
  );
}

/**
 * App
 *
 * Top-level router. Delegates to MainLayout or Mini based on the URL path.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"     element={<MainLayout />} />
        <Route path="/mini" element={<Mini />} />
      </Routes>
    </BrowserRouter>
  );
}
