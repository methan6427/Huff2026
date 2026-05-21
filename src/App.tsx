// Main app with two pages: one for compress/decompress, one for drag-and-drop.
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CompressTab } from './components/CompressTab';
import { DecompressTab } from './components/DecompressTab';
import { Mini } from './pages/Mini';

type ActiveTab = 'compress' | 'decompress';

// Show the header, tabs, and content in the main page.
function MainLayout() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('compress');

  return (
    <div className="app-shell">
      {/* Top of page with title */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-title-group">
            {/* Show the name "Huffman Coder" and the class information */}
            <h1 className="app-title">Huffman Coder</h1>
            <p className="app-subtitle">COM336 · Design &amp; Analysis of Algorithms · Birzeit University</p>
          </div>
        </div>
      </header>

      {/* Buttons to switch between Compress and Decompress */}
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

      {/* Show the selected tab (Compress or Decompress) */}
      <main className="app-main">
        {activeTab === 'compress' ? <CompressTab /> : <DecompressTab />}
      </main>

      {/* Bottom text */}
      <footer className="app-footer">
        Huffman Coding · COM336 Project 2 · Birzeit University
      </footer>
    </div>
  );
}

// Choose which page to show based on the URL path.
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
