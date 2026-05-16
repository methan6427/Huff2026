/**
 * StatsPanel.tsx
 *
 * Displays compression/decompression statistics in large, readable readouts.
 * Shows original size, output size, and compression ratio (or expand ratio).
 * Numbers animate in using a CSS count-up keyframe on mount.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

interface StatsPanelProps {
  originalSize: number;     // bytes
  outputSize: number;       // bytes (compressed or decompressed)
  ratio: number;            // outputSize / originalSize × 100 (%)
  mode: 'compress' | 'decompress';
}

/**
 * formatBytes
 *
 * Formats a byte count into the most appropriate human-readable unit.
 *
 * @param bytes - byte count
 * @returns formatted string (e.g. "48.23 KB")
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * StatCard
 *
 * A single statistic readout: a large value with a label beneath it.
 *
 * @param value - the string value to display (e.g. "48.23 KB")
 * @param label - description label
 * @param accent - CSS colour variable name for the value's colour
 */
function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color: accent }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/**
 * StatsPanel
 *
 * Three side-by-side stat cards: original size, output size, ratio.
 * A colour-coded ratio bar shows whether compression improved or worsened the size.
 *
 * @param originalSize - bytes of the input
 * @param outputSize   - bytes of the output
 * @param ratio        - outputSize / originalSize * 100 (%)
 * @param mode         - 'compress' or 'decompress' (changes labels)
 */
export function StatsPanel({ originalSize, outputSize, ratio, mode }: StatsPanelProps) {
  const isSavings = ratio < 100; // true when the compressed file is smaller

  // Ratio display: if compressing and ratio > 100, we expanded (bad)
  const ratioDisplay = mode === 'compress'
    ? `${ratio.toFixed(1)}%`
    : `${((outputSize / originalSize) * 100).toFixed(1)}%`;

  // Colour the ratio: green = savings, orange = expansion
  const ratioAccent = (mode === 'compress' && isSavings) || mode === 'decompress'
    ? 'var(--accent-success)'
    : 'var(--accent-warning)';

  const savingsBytes = originalSize - outputSize;
  const savingsPct = Math.abs(((savingsBytes / originalSize) * 100)).toFixed(1);

  return (
    <div className="stats-panel">
      <div className="stats-panel-header">
        <span className="panel-label">STATISTICS</span>
      </div>

      <div className="stats-grid">
        <StatCard
          value={formatBytes(originalSize)}
          label={mode === 'compress' ? 'ORIGINAL SIZE' : 'COMPRESSED SIZE'}
          accent="var(--text-primary)"
        />
        <StatCard
          value={formatBytes(outputSize)}
          label={mode === 'compress' ? 'COMPRESSED SIZE' : 'DECODED SIZE'}
          accent="var(--accent-primary)"
        />
        <StatCard
          value={ratioDisplay}
          label="RATIO"
          accent={ratioAccent}
        />
      </div>

      {/* Ratio progress bar */}
      <div className="ratio-bar-container">
        <div
          className="ratio-bar-fill"
          style={{
            width: `${Math.min(ratio, 200)}%`, // cap at 200% for display
            backgroundColor: ratioAccent,
          }}
        />
      </div>

      {/* Savings / expansion label */}
      {mode === 'compress' && (
        <p className="stats-note">
          {isSavings
            ? `↓ Saved ${formatBytes(savingsBytes)} (${savingsPct}% reduction)`
            : `↑ Expanded by ${formatBytes(-savingsBytes)} (${savingsPct}% increase)`}
        </p>
      )}
    </div>
  );
}
