/**
 * CompressTab.tsx
 *
 * The main Compress panel: picks any file, runs the Huffman compression
 * pipeline, then shows the encoding table, stats, header breakdown,
 * and a download button for the resulting .huff file.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { useCompressor } from '../hooks/useCompressor';
import { FilePicker } from './FilePicker';
import { StatsPanel } from './StatsPanel';
import { EncodingTable } from './EncodingTable';
import { HeaderDisplay } from './HeaderDisplay';
import { RawHeaderViewer } from './RawHeaderViewer';

/**
 * downloadFile
 *
 * Creates a temporary object URL from a Uint8Array and triggers a browser download.
 * Uses URL.createObjectURL + a hidden <a> click — the standard browser approach.
 *
 * @param data     - file bytes to download
 * @param fileName - the suggested filename for the downloaded file
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
 */
export function CompressTab() {
  const { state, run, reset } = useCompressor();

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

          {/* Statistics readout */}
          <StatsPanel
            originalSize={state.result.originalSize}
            outputSize={state.result.compressedSize}
            ratio={state.result.compressionRatio}
            mode="compress"
          />

          {/* Header field breakdown */}
          <HeaderDisplay
            extension={state.result.extension}
            originalFileSize={state.result.originalSize}
            treeSerializedBits={state.result.treeSerializedBits}
            leafCount={state.result.leafCount}
          />

          {/* Byte-level hex + binary dump of the actual .huff header */}
          <RawHeaderViewer buffer={state.result.buffer} />

          {/* Huffman code table — the money shot */}
          <EncodingTable codeTable={state.result.codeTable} />

          {/* Reset / compress another file */}
          <button className="btn-reset" onClick={reset} style={{ marginTop: '1.5rem' }}>
            ← COMPRESS ANOTHER FILE
          </button>
        </div>
      )}
    </div>
  );
}
