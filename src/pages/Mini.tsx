/**
 * Mini.tsx
 *
 * Simplified drag-and-drop interface at the /mini route for quick file
 * compression/decompression without extra UI chrome.
 *
 * Behaviour:
 *   - Drop any non-.huff file  → compress it → auto-download the .huff
 *   - Drop a .huff file        → decompress it → auto-download the original
 *
 * This fulfils the project requirement for a "simplified secondary interface"
 * that integrates with the file explorer (drag a file onto this page).
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { useState, useCallback } from 'react';
import { compress } from '../algorithms/compress';
import { decompress } from '../algorithms/decompress';

type MiniStatus = 'idle' | 'processing' | 'done' | 'error';

/**
 * downloadFile
 *
 * Triggers a browser download from a Uint8Array.
 */
function downloadFile(data: Uint8Array, fileName: string): void {
  // new Uint8Array(data) copies bytes into a fresh ArrayBuffer satisfying TS 5.6 Blob typing
  const blob = new Blob([new Uint8Array(data)]);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Mini
 *
 * A full-screen drag-and-drop zone. Automatically detects whether to
 * compress or decompress based on the dropped file's extension.
 * On completion the output file is downloaded with no extra clicks.
 */
export function Mini() {
  const [status, setStatus] = useState<MiniStatus>('idle');
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    setStatus('processing');
    setMessage('');

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const isHuff = file.name.endsWith('.huff');

        if (isHuff) {
          // Decompress: strip the .huff extension to recover the original name
          const result = decompress(data);
          const ext    = result.originalExtension;
          const outName = ext ? `decoded.${ext}` : 'decoded_file';
          downloadFile(result.buffer, outName);
          setMessage(`Decoded → ${outName}`);
        } else {
          // Compress: append .huff to the original file name
          const result  = compress(data, file.name);
          downloadFile(result.buffer, result.huffFileName);
          setMessage(`Compressed → ${result.huffFileName}`);
        }

        setStatus('done');
      } catch (err) {
        setStatus('error');
        setMessage(String(err));
      }
    };

    reader.onerror = () => {
      setStatus('error');
      setMessage('Failed to read file.');
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  return (
    <div
      className={`mini-page ${isDragging ? 'mini-dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Status display */}
      {status === 'idle' && (
        <>
          <div className="mini-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="mini-title">HUFFMAN QUICK</h1>
          <p className="mini-sub">Drop any file to compress it</p>
          <p className="mini-sub">Drop a <span className="mini-accent">.huff</span> file to decompress it</p>
          <p className="mini-hint">Output downloads automatically — no extra clicks</p>
        </>
      )}

      {status === 'processing' && (
        <>
          <div className="pulse-ring large" />
          <div className="pulse-dot large" />
          <p className="mini-processing">PROCESSING…</p>
        </>
      )}

      {status === 'done' && (
        <>
          <div className="mini-check">✓</div>
          <p className="mini-done-msg">{message}</p>
          <button className="btn-reset" onClick={() => { setStatus('idle'); setMessage(''); }}>
            PROCESS ANOTHER FILE
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mini-error-icon">⚠</div>
          <p className="mini-error-msg">{message}</p>
          <button className="btn-reset" onClick={() => { setStatus('idle'); setMessage(''); }}>
            TRY AGAIN
          </button>
        </>
      )}

      {/* Subtle back link */}
      <a href="/" className="mini-back">← Full Interface</a>
    </div>
  );
}
