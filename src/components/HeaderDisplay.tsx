/**
 * HeaderDisplay.tsx
 *
 * Visualises the .huff file header fields in a colour-coded breakdown.
 * Each field is shown with its name, value, and bit-width so the instructor
 * can see exactly what is stored in the header.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

interface HeaderDisplayProps {
  extension: string;
  originalFileSize: number;
  treeSerializedBits: number;
  leafCount?: number;
}

/**
 * HeaderField
 *
 * Renders a single header field as a labelled row with a coloured indicator.
 *
 * @param label   - field name
 * @param value   - human-readable value
 * @param bits    - how many bits this field occupies
 * @param accent  - CSS colour for the left-border accent
 */
function HeaderField({
  label,
  value,
  bits,
  accent,
}: {
  label: string;
  value: string;
  bits: string;
  accent: string;
}) {
  return (
    <div className="header-field" style={{ borderLeftColor: accent }}>
      <div className="header-field-top">
        <span className="header-field-label">{label}</span>
        <span className="header-field-bits" style={{ color: accent }}>{bits}</span>
      </div>
      <div className="header-field-value">{value}</div>
    </div>
  );
}

/**
 * HeaderDisplay
 *
 * Shows all four header fields defined in the .huff format:
 *   [1] Extension length (8 bits)
 *   [2] Extension characters (8 × length bits)
 *   [3] Original file size (32 bits)
 *   [4] Tree bit length (32 bits)
 *   [5] Serialised tree (N bits)
 *
 * @param extension          - the original file extension stored in the header
 * @param originalFileSize   - original size in bytes (stored in header field 3)
 * @param treeSerializedBits - bit count of the serialised tree (header field 4)
 * @param leafCount          - number of unique byte values (for context)
 */
export function HeaderDisplay({
  extension,
  originalFileSize,
  treeSerializedBits,
  leafCount,
}: HeaderDisplayProps) {
  const extBits = extension.length * 8;

  // Total header overhead in bits before the encoded data:
  //   8 (ext len) + extBits (ext chars) + 32 (orig size) + 32 (tree len) + treeSerializedBits
  const headerTotalBits = 8 + extBits + 32 + 32 + treeSerializedBits;
  const headerBytes = Math.ceil(headerTotalBits / 8);

  return (
    <div className="header-display-container">
      <div className="header-display-title">
        <span className="panel-label">HEADER STRUCTURE</span>
        <span className="header-display-overhead">
          {headerBytes} bytes overhead
        </span>
      </div>

      {/* Each field gets a unique accent colour for quick visual scanning */}
      <HeaderField
        label="[1] EXTENSION LENGTH"
        value={`${extension.length} char${extension.length !== 1 ? 's' : ''}`}
        bits="8 bits"
        accent="var(--accent-primary)"
      />

      <HeaderField
        label="[2] EXTENSION"
        value={extension.length > 0 ? `"${extension.toUpperCase()}"` : '(none)'}
        bits={`${extBits} bits`}
        accent="#7EB8FF"
      />

      <HeaderField
        label="[3] ORIGINAL FILE SIZE"
        value={`${originalFileSize.toLocaleString()} bytes`}
        bits="32 bits"
        accent="var(--accent-warning)"
      />

      <HeaderField
        label="[4] TREE BIT LENGTH"
        value={`${treeSerializedBits} bits`}
        bits="32 bits"
        accent="#FF7EB8"
      />

      <HeaderField
        label="[5] SERIALISED TREE"
        value={`PostOrder · ${treeSerializedBits} bits${leafCount !== undefined ? ` · ${leafCount} leaves` : ''}`}
        bits={`${treeSerializedBits} bits`}
        accent="var(--accent-success)"
      />

      {/* Schema diagram — mirrors the lecture whiteboard exactly */}
      <div className="header-diagram">
        <div className="header-diagram-title">BINARY LAYOUT</div>
        <div className="header-diagram-segments">
          <div className="hd-seg" style={{ background: 'var(--accent-primary)', flex: 1, minWidth: 8, maxWidth: 24 }} title="Ext length (8 bits)" />
          <div className="hd-seg" style={{ background: '#7EB8FF', flex: Math.max(extBits, 1), minWidth: 8, maxWidth: 48 }} title={`Extension (${extBits} bits)`} />
          <div className="hd-seg" style={{ background: 'var(--accent-warning)', flex: 32, minWidth: 24, maxWidth: 64 }} title="Orig size (32 bits)" />
          <div className="hd-seg" style={{ background: '#FF7EB8', flex: 32, minWidth: 24, maxWidth: 64 }} title="Tree len (32 bits)" />
          <div className="hd-seg" style={{ background: 'var(--accent-success)', flex: Math.max(treeSerializedBits / 8, 8), minWidth: 24, maxWidth: 80 }} title={`Tree (${treeSerializedBits} bits)`} />
          <div className="hd-seg hd-seg-data" title="Encoded data" />
        </div>
        <div className="header-diagram-labels">
          <span style={{ color: 'var(--accent-primary)' }}>ext·len</span>
          <span style={{ color: '#7EB8FF' }}>ext</span>
          <span style={{ color: 'var(--accent-warning)' }}>orig·size</span>
          <span style={{ color: '#FF7EB8' }}>tree·len</span>
          <span style={{ color: 'var(--accent-success)' }}>tree</span>
          <span style={{ color: 'var(--text-secondary)' }}>data…</span>
        </div>
      </div>
    </div>
  );
}
