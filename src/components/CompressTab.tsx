/**
 * CompressTab.tsx
 *
 * The main Compress panel: picks any file, runs the Huffman compression
 * pipeline, then shows the encoding table, stats, header breakdown,
 * and a download button for the resulting .huff file.
 *
 * Accepts an optional onStatusChange callback so App.tsx can lift the
 * compression status for the Algorithm Steps panel.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { useEffect } from 'react';
import { useCompressor } from '../hooks/useCompressor';
import { FilePicker } from './FilePicker';
import { StatsPanel } from './StatsPanel';
import { EncodingTable } from './EncodingTable';
import { HeaderDisplay } from './HeaderDisplay';
import { RawHeaderViewer } from './RawHeaderViewer';
import type { ProcessStatus } from '../types/HuffmanTypes';

interface CompressTabProps {
  /** Called whenever the compressor state changes — used by App.tsx to drive the AlgorithmSteps panel. */
  onStatusChange?: (status: ProcessStatus) => void;
}

/**
 * downloadFile
 *
 * Creates a temporary object URL from a Uint8Array and triggers a browser download.
 * Uses URL.createObjectURL + a hidden <a> click — the standard browser approach.
 *
 * @param data     - file bytes to download
 * @param fileName - the suggested filename for the downloaded file
 * Time complexity: O(n) — Blob creation is proportional to file size
 */
function downloadFile(data: Uint8Array, fileName: string): void {
  // new Uint8Array(data) copies bytes into a fresh ArrayBuffer (not SharedArrayBuffer),
  // satisfying TS 5.6's stricter Blob constructor typing
  const blob = new Blob([new Uint8Array(data)]);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url); // release memory immediately after click
}

/**
 * CompressTab
 *
 * Renders the full compress workflow:
 *   idle      → FilePicker
 *   processing → spinner
 *   done      → results (EncodingTable + StatsPanel + HeaderDisplay + download button)
 *   error     → error message + reset button
 *
 * @param onStatusChange - optional callback invoked on every status transition
 * Time complexity: driven by the compression pipeline — O(n log n)
 */
export function CompressTab({ onStatusChange }: CompressTabProps) {
  const { state, run, reset } = useCompressor();

  // Propagate status changes to the parent (App.tsx) for the Algorithm Steps panel
  useEffect(() => {
    onStatusChange?.(state.status);
  }, [state.status, onStatusChange]);

  return (
    <div className="tab-content">
      {/* Always show the file picker (re-picking resets results automatically) */}
      <FilePicker
        onFile={(file) => run(file)}
        label="DROP ANY FILE / CLICK TO BROWSE"
        disabled={state.status === 'processing'}
      />

      {/* Processing indicator */}
      {state.status === 'processing' && (
        <div className="processing-indicator">
          <div className="pulse-ring" />
          <div className="pulse-dot" />
          <p>ENCODING…</p>
        </div>
      )}

      {/* Error state */}
      {state.status === 'error' && (
        <div className="error-panel">
          <span className="error-icon">⚠</span>
          <p className="error-message">{state.error}</p>
          <button className="btn-reset" onClick={reset}>RESET</button>
        </div>
      )}

      {/* Results */}
      {state.status === 'done' && state.result && (
        <div className="results-container">
          {/* Download button — prominently at the top */}
          <div className="download-bar">
            <div className="download-info">
              <span className="download-filename">{state.result.huffFileName}</span>
              <span className="download-size">
                {(state.result.compressedSize / 1024).toFixed(1)} KB
              </span>
            </div>
            <button
              className="btn-download"
              onClick={() => downloadFile(state.result!.buffer, state.result!.huffFileName)}
            >
              ↓ DOWNLOAD .HUFF
            </button>
          </div>

          {/* Statistics readout — now includes leafCount, treeSerializedBits, extension */}
          <StatsPanel
            originalSize={state.result.originalSize}
            outputSize={state.result.compressedSize}
            ratio={state.result.compressionRatio}
            mode="compress"
            leafCount={state.result.leafCount}
            treeSerializedBits={state.result.treeSerializedBits}
            extension={state.result.extension}
          />

          {/* Header field breakdown — protocol diagram table */}
          <HeaderDisplay
            extension={state.result.extension}
            originalFileSize={state.result.originalSize}
            treeSerializedBits={state.result.treeSerializedBits}
            leafCount={state.result.leafCount}
          />

          {/* Byte-level hex + binary dump of the actual .huff header */}
          <RawHeaderViewer buffer={state.result.buffer} />

          {/* Huffman code table — sorted by frequency, with summary row */}
          <EncodingTable
            codeTable={state.result.codeTable}
            freqTable={state.result.freqTable}
            originalSize={state.result.originalSize}
          />

          {/* Reset / compress another file */}
          <button className="btn-reset" onClick={reset} style={{ marginTop: '1.5rem' }}>
            ← COMPRESS ANOTHER FILE
          </button>
        </div>
      )}
    </div>
  );
}
