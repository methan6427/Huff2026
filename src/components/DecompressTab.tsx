/**
 * DecompressTab.tsx
 *
 * The Decompress panel: picks a .huff file, runs the decompression pipeline
 * (tree rebuild + bit decode), then shows the header info, stats, and a
 * download button for the recovered original file.
 *
 * Accepts an optional onStatusChange callback so App.tsx can lift the
 * decompression status for the Algorithm Steps panel.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { useEffect } from 'react';
import { useDecompressor } from '../hooks/useDecompressor';
import { FilePicker } from './FilePicker';
import { StatsPanel } from './StatsPanel';
import { HeaderDisplay } from './HeaderDisplay';
import { RawHeaderViewer } from './RawHeaderViewer';
import type { ProcessStatus } from '../types/HuffmanTypes';

interface DecompressTabProps {
  /** Called whenever the decompressor state changes — used by App.tsx for the AlgorithmSteps panel. */
  onStatusChange?: (status: ProcessStatus) => void;
}

/**
 * downloadFile
 *
 * Triggers a browser download of a Uint8Array as a file.
 *
 * @param data     - file bytes
 * @param fileName - suggested download name
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
 * DecompressTab
 *
 * Renders the full decompress workflow:
 *   idle      → FilePicker (.huff only)
 *   processing → spinner
 *   done      → results (HeaderDisplay + StatsPanel + download button)
 *   error     → error message + reset button
 *
 * @param onStatusChange - optional callback invoked on every status transition
 * Time complexity: driven by decompression — O(n) where n = original file size
 */
export function DecompressTab({ onStatusChange }: DecompressTabProps) {
  const { state, run, reset } = useDecompressor();

  // Propagate status changes to App.tsx for the Algorithm Steps panel
  useEffect(() => {
    onStatusChange?.(state.status);
  }, [state.status, onStatusChange]);

  return (
    <div className="tab-content">
      <FilePicker
        onFile={(file) => run(file)}
        accept=".huff"
        label="DROP .HUFF FILE / CLICK TO BROWSE"
        disabled={state.status === 'processing'}
      />

      {/* Processing indicator */}
      {state.status === 'processing' && (
        <div className="processing-indicator">
          <div className="pulse-ring" />
          <div className="pulse-dot" />
          <p>DECODING…</p>
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
      {state.status === 'done' && state.result && (() => {
        const ext = state.result.originalExtension;
        const outName = ext ? `decoded.${ext}` : 'decoded_file';

        return (
          <div className="results-container">
            {/* Download button */}
            <div className="download-bar">
              <div className="download-info">
                <span className="download-filename">{outName}</span>
                <span className="download-size">
                  {(state.result.decompressedSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                className="btn-download"
                onClick={() => downloadFile(state.result!.buffer, outName)}
              >
                ↓ DOWNLOAD DECODED FILE
              </button>
            </div>

            {/* Stats — pass treeSerializedBits so the secondary row renders */}
            <StatsPanel
              originalSize={state.result.compressedSize}
              outputSize={state.result.decompressedSize}
              ratio={(state.result.compressedSize / Math.max(state.result.decompressedSize, 1)) * 100}
              mode="decompress"
              treeSerializedBits={state.result.headerInfo.treeSerializedBits}
            />

            {/* Header field breakdown */}
            <HeaderDisplay
              extension={state.result.headerInfo.extension}
              originalFileSize={state.result.headerInfo.originalFileSize}
              treeSerializedBits={state.result.headerInfo.treeSerializedBits}
            />

            {/* Byte-level hex + binary dump of the actual .huff header */}
            {state.rawHuffBuffer && (
              <RawHeaderViewer buffer={state.rawHuffBuffer} />
            )}

            <button className="btn-reset" onClick={reset} style={{ marginTop: '1.5rem' }}>
              ← DECOMPRESS ANOTHER FILE
            </button>
          </div>
        );
      })()}
    </div>
  );
}
