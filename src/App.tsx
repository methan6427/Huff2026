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
          <div className="app-title-group">
            <h1 className="app-title">Huffman Coder</h1>
            <p className="app-subtitle">COM336 · Design &amp; Analysis of Algorithms · Birzeit University</p>
          </div>
        </div>
      </header>

      {/* ── Tab Bar ───────────────────────────────────────────────────── */}
      <nav className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'compress' ? 'active' : ''}`}
          onClick={() => setActiveTab('compress')}
        >
          Compress
        </button>
        <button
          className={`tab-btn ${activeTab === 'decompress' ? 'active' : ''}`}
          onClick={() => setActiveTab('decompress')}
        >
          Decompress
        </button>
      </nav>

      {/* ── Content Area ──────────────────────────────────────────────── */}
      <main className="app-main">
        {activeTab === 'compress' ? <CompressTab /> : <DecompressTab />}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        Huffman Coding · COM336 Project 2 · Birzeit University
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
