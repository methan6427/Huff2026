/**
 * StatsPanel.tsx
 *
 * Displays compression/decompression statistics.
 * Shows original size, output size, and compression ratio as both a
 * percentage and an X:1 ratio. If the compressed file is larger than the
 * original (happens for small or random-content files), a clear warning is shown.
 *
 * Additional stats (when treeSerializedBits and extension are available):
 *   - Number of unique bytes (leaf count)
 *   - Tree overhead in bytes
 *   - Total header overhead in bytes
 *   - Net data savings in bytes
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

interface StatsPanelProps {
  originalSize: number;              // bytes
  outputSize: number;                // bytes (compressed or decompressed)
  ratio: number;                     // outputSize / originalSize × 100 (%)
  mode: 'compress' | 'decompress';
  leafCount?: number;                // unique byte values in the file
  treeSerializedBits?: number;       // bit count of the serialised Huffman tree
  extension?: string;                // original file extension (for header size calc)
}

/**
 * formatBytes
 *
 * Formats a byte count into the most appropriate human-readable unit.
 *
 * @param bytes - byte count (may be negative for savings display)
 * @returns formatted string (e.g. "48.23 KB")
 * Time complexity: O(1)
 */
function formatBytes(bytes: number): string {
  const abs = Math.abs(bytes);
  const sign = bytes < 0 ? '-' : '';
  if (abs === 0) return '0 B';
  if (abs < 1024) return `${sign}${abs} B`;
  if (abs < 1024 * 1024) return `${sign}${(abs / 1024).toFixed(2)} KB`;
  if (abs < 1024 * 1024 * 1024) return `${sign}${(abs / 1024 / 1024).toFixed(2)} MB`;
  return `${sign}${(abs / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * StatCard
 *
 * A single large statistic readout with a coloured value and a label below.
 *
 * @param value  - the string value to display (e.g. "48.23 KB")
 * @param label  - description label
 * @param accent - CSS colour variable name for the value colour
 * Time complexity: O(1)
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
 * DetailRow
 *
 * A secondary information row in the stats panel: a label on the left and
 * a monospaced value on the right, separated by a dotted line.
 *
 * @param label - description
 * @param value - the value to show
 * @param accent - optional colour for the value
 * Time complexity: O(1)
 */
function DetailRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="stats-detail-row">
      <span className="stats-detail-label">{label}</span>
      <span className="stats-detail-value" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
    </div>
  );
}

/**
 * StatsPanel
 *
 * Three headline stat cards (original / output / ratio) plus a secondary
 * details section with tree overhead, header size, and net savings.
 *
 * Compression ratio is shown as:
 *   - a percentage (e.g. "62.3%") — what fraction of the original
 *   - an X:1 ratio (e.g. "1.6:1") — how many original bytes per compressed byte
 *
 * When the compressed output is larger than the input, an amber warning
 * banner explains that Huffman overhead exceeds savings.
 *
 * @param originalSize       - bytes of the input file
 * @param outputSize         - bytes of the output file
 * @param ratio              - outputSize / originalSize * 100 (%)
 * @param mode               - 'compress' or 'decompress' (changes labels)
 * @param leafCount          - number of unique byte values
 * @param treeSerializedBits - bit count of the serialised Huffman tree
 * @param extension          - original file extension (used for header size calc)
 * Time complexity: O(1)
 */
export function StatsPanel({
  originalSize,
  outputSize,
  ratio,
  mode,
  leafCount,
  treeSerializedBits,
  extension,
}: StatsPanelProps) {
  // In compress mode: ratio < 100 means the file shrank (good)
  // In decompress mode: ratio is typically ≥ 100 (decoding restores the original)
  const isExpanded = mode === 'compress' && ratio > 100;

  // Compression ratio as "X:1" — how many original bytes per output byte.
  // Only meaningful for compress mode. Clamp to 0.01 to avoid divide-by-zero.
  const xToOneRatio = mode === 'compress'
    ? (originalSize / Math.max(outputSize, 1)).toFixed(2)
    : null;

  // Colour: green when we saved space, amber/orange when we expanded
  const ratioAccent = (mode === 'compress' && !isExpanded) || mode === 'decompress'
    ? 'var(--accent-success)'
    : 'var(--accent-warning)';

  // Ratio display string: "62.3% (1.6:1)" for compress, plain percentage for decompress
  const ratioDisplay = mode === 'compress'
    ? `${ratio.toFixed(1)}%`
    : `${((outputSize / Math.max(originalSize, 1)) * 100).toFixed(1)}%`;

  const xToOneDisplay = xToOneRatio ? `${xToOneRatio}:1` : null;

  // Net savings (positive = we saved bytes, negative = file grew)
  const savingsBytes = originalSize - outputSize;

  // ── Header overhead breakdown (compress mode only) ──────────────────────
  // These fields are only available when full header info is passed in
  const hasHeaderInfo = treeSerializedBits !== undefined && extension !== undefined;

  let treeOverheadBytes: number | null = null;
  let headerTotalBytes: number | null = null;

  if (hasHeaderInfo) {
    const extBits = (extension!.length) * 8;
    // Header bits: [1] ext length (8) + [2] ext chars + [3] orig size (32) + [4] tree len (32) + [5] tree
    const headerBits = 8 + extBits + 32 + 32 + treeSerializedBits!;
    treeOverheadBytes = Math.ceil(treeSerializedBits! / 8);
    headerTotalBytes  = Math.ceil(headerBits / 8);
  }

  return (
    <div className="stats-panel">
      <div className="stats-panel-header">
        <span className="panel-label">STATISTICS</span>
        {xToOneDisplay && (
          <span className="stats-xto1" style={{ color: ratioAccent }}>
            {xToOneDisplay}
          </span>
        )}
      </div>

      {/* ── Expansion warning (only when compressed > original) ─────────── */}
      {isExpanded && (
        <div className="stats-expand-warning">
          <span className="stats-expand-icon">⚠</span>
          <span className="stats-expand-text">
            File expanded — Huffman overhead exceeds savings (small or high-entropy file)
          </span>
        </div>
      )}

      {/* ── Three headline stat cards ──────────────────────────────────── */}
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
          label={mode === 'compress' ? `RATIO  ${xToOneDisplay ?? ''}` : 'RATIO'}
          accent={ratioAccent}
        />
      </div>

      {/* Thin ratio progress bar — width proportional to ratio (capped at 100%) */}
      <div className="ratio-bar-container">
        <div
          className="ratio-bar-fill"
          style={{
            width: `${Math.min(ratio, 100)}%`,
            backgroundColor: ratioAccent,
          }}
        />
      </div>

      {/* ── Savings summary line ─────────────────────────────────────── */}
      {mode === 'compress' && (
        <p className="stats-note">
          {savingsBytes >= 0
            ? `↓ Saved ${formatBytes(savingsBytes)} (${(100 - ratio).toFixed(1)}% reduction)`
            : `↑ Expanded by ${formatBytes(-savingsBytes)} (${(ratio - 100).toFixed(1)}% increase)`}
        </p>
      )}

      {/* ── Secondary detail rows (compress mode with full info) ─────── */}
      {mode === 'compress' && hasHeaderInfo && (
        <div className="stats-details">
          {treeOverheadBytes !== null && (
            <DetailRow
              label="TREE OVERHEAD"
              value={`${treeOverheadBytes} bytes (${treeSerializedBits} bits)`}
              accent="var(--text-secondary)"
            />
          )}
          {headerTotalBytes !== null && (
            <DetailRow
              label="TOTAL HEADER SIZE"
              value={`${headerTotalBytes} bytes`}
              accent="var(--text-secondary)"
            />
          )}
          <DetailRow
            label="NET DATA SAVINGS"
            value={`${formatBytes(savingsBytes)}`}
            accent={savingsBytes >= 0 ? 'var(--accent-success)' : 'var(--accent-warning)'}
          />
        </div>
      )}
    </div>
  );
}
