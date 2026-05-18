/**
 * Mini.tsx
 *
 * Simplified drag-and-drop interface at the /mini route for quick file
 * compression/decompression without extra UI chrome.
 *
 * Behaviour:
 *   - Drop any non-.huff file  → compress it → auto-download the .huff
 *   - Drop a .huff file        → decompress it → auto-download the original
 *   - Press Escape (any state) → resets to idle
 *
 * This fulfils the project requirement for a "simplified secondary interface"
 * that integrates with the file explorer (drag a file onto this page).
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { useState, useCallback, useEffect } from 'react';
import { compress } from '../algorithms/compress';
import { decompress } from '../algorithms/decompress';

type MiniStatus = 'idle' | 'processing' | 'done' | 'error';

/** File metadata captured on drop, displayed during processing and after completion. */
interface DroppedFile {
  name: string;
  sizeBytes: number;
}

/**
 * formatBytes
 *
 * Compact byte formatter for the file size display.
 *
 * @param bytes - byte count
 * @returns formatted string (e.g. "1.23 MB")
 * Time complexity: O(1)
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * downloadFile
 *
 * Triggers a browser download from a Uint8Array.
 *
 * @param data     - file bytes
 * @param fileName - suggested filename for the download
 * Time complexity: O(n) — proportional to file size
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
 * A full-screen drag-and-drop zone. Auto-detects compress vs decompress
 * from the dropped file extension (.huff → decompress, anything else → compress).
 * Downloads the output file immediately with no extra clicks.
 * Pressing Escape always returns to the idle state.
 *
 * Time complexity: O(n log n) for compress, O(n) for decompress
 */
export function Mini() {
  const [status,    setStatus]    = useState<MiniStatus>('idle');
  const [message,   setMessage]   = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<DroppedFile | null>(null);
  const [resultName,  setResultName]  = useState('');

  // Reset to idle state — called by the reset button and by Escape key
  const resetToIdle = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setDroppedFile(null);
    setResultName('');
  }, []);

  // Escape key listener — registered once, cleaned up on unmount
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') resetToIdle();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [resetToIdle]);

  /**
   * processFile
   *
   * Reads the dropped File as ArrayBuffer and calls the appropriate algorithm.
   * Stores file metadata in state so it can be displayed during and after processing.
   *
   * @param file - the File object from the drag event
   * Time complexity: O(n log n) for compress, O(n) for decompress
   */
  const processFile = useCallback((file: File) => {
    setStatus('processing');
    setMessage('');
    setDroppedFile({ name: file.name, sizeBytes: file.size });
    setResultName('');

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data   = new Uint8Array(reader.result as ArrayBuffer);
        const isHuff = file.name.toLowerCase().endsWith('.huff');

        if (isHuff) {
          // Decompress: strip the .huff extension to recover the original name
          const result  = decompress(data);
          const ext     = result.originalExtension;
          const outName = ext ? `decoded.${ext}` : 'decoded_file';
          downloadFile(result.buffer, outName);
          setResultName(outName);
          setMessage(`${outName}  ·  ${formatBytes(result.decompressedSize)}`);
        } else {
          // Compress: append .huff to the original file name
          const result = compress(data, file.name);
          downloadFile(result.buffer, result.huffFileName);
          setResultName(result.huffFileName);
          setMessage(`${result.huffFileName}  ·  ${formatBytes(result.compressedSize)}`);
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

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  return (
    <div
      className={`mini-page ${isDragging ? 'mini-dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* ── Idle state ──────────────────────────────────────────── */}
      {status === 'idle' && (
        <>
          <div className="mini-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Large primary label — the key instruction */}
          <h1 className="mini-drop-label">
            DROP ANY FILE TO COMPRESS
            <span className="mini-drop-sep"> • </span>
            DROP <span className="mini-accent">.huff</span> TO DECOMPRESS
          </h1>

          <p className="mini-hint">Output downloads automatically — no extra clicks</p>
          <p className="mini-hint mini-esc-hint">Press <kbd className="mini-kbd">ESC</kbd> to reset</p>
        </>
      )}

      {/* ── Processing state ─────────────────────────────────────── */}
      {status === 'processing' && (
        <>
          <div className="pulse-ring large" />
          <div className="pulse-dot large" />
          <p className="mini-processing">PROCESSING…</p>
          {/* Show the file being processed */}
          {droppedFile && (
            <div className="mini-file-meta">
              <span className="mini-file-name">{droppedFile.name}</span>
              <span className="mini-file-size">{formatBytes(droppedFile.sizeBytes)}</span>
            </div>
          )}
        </>
      )}

      {/* ── Done state ───────────────────────────────────────────── */}
      {status === 'done' && (
        <>
          <div className="mini-check">✓</div>

          {/* Source file info */}
          {droppedFile && (
            <div className="mini-file-meta">
              <span className="mini-file-name">{droppedFile.name}</span>
              <span className="mini-file-arrow">→</span>
              <span className="mini-result-name">{resultName}</span>
            </div>
          )}

          {/* Full size info (result name + size) */}
          <p className="mini-done-msg">{message}</p>

          <button className="btn-reset" onClick={resetToIdle}>
            PROCESS ANOTHER FILE
          </button>
          <p className="mini-hint mini-esc-hint">
            Press <kbd className="mini-kbd">ESC</kbd> to reset
          </p>
        </>
      )}

      {/* ── Error state ─────────────────────────────────────────── */}
      {status === 'error' && (
        <>
          <div className="mini-error-icon">⚠</div>
          {droppedFile && (
            <p className="mini-file-name mini-error-file">{droppedFile.name}</p>
          )}
          <p className="mini-error-msg">{message}</p>
          <button className="btn-reset" onClick={resetToIdle}>
            TRY AGAIN
          </button>
          <p className="mini-hint mini-esc-hint">
            Press <kbd className="mini-kbd">ESC</kbd> to reset
          </p>
        </>
      )}

      {/* Subtle back link — always visible */}
      <a href="/" className="mini-back">← Full Interface</a>
    </div>
  );
}
