/**
 * RawHeaderViewer.tsx
 *
 * Displays the actual bytes of the .huff file header as a byte-level hex + binary dump.
 * Each byte is shown with its offset, hex value, 8-bit binary representation,
 * and a colour-coded field label matching the header layout.
 *
 * This component parses the raw buffer directly — it does not rely on pre-computed
 * values — so what you see is exactly what is stored in the file.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

interface RawHeaderViewerProps {
  buffer: Uint8Array; // the full .huff file bytes (from compression or the input file)
}

// Field colours — identical to the HeaderDisplay component for visual consistency
const COLORS = {
  extLen:   'var(--accent-primary)',  // [1] extension length
  extChar:  '#7EB8FF',                // [2] extension characters
  origSize: 'var(--accent-warning)',  // [3] original file size
  treeLen:  '#FF7EB8',                // [4] tree bit count
  treeData: 'var(--accent-success)',  // [5] serialised tree bytes
  data:     'var(--text-secondary)',  // [6] encoded data
};

// Maximum tree + data bytes to display before truncating (keep UI concise)
const MAX_TREE_ROWS  = 12;
const MAX_DATA_ROWS  = 4;

interface ByteRow {
  offset: number;
  value:  number;
  color:  string;
  field:  string; // human-readable field label
}

/**
 * parseHeader
 *
 * Reads the buffer and returns an array of annotated byte rows for display.
 * Parses the header layout exactly as compress.ts writes it and decompress.ts reads it.
 *
 * @param buf - the full .huff Uint8Array
 * @returns array of ByteRow objects, one per displayed byte
 */
function parseHeader(buf: Uint8Array): { rows: ByteRow[]; truncated: boolean; dataStartByte: number } {
  const rows: ByteRow[] = [];
  let offset = 0;
  let truncated = false;

  const push = (color: string, field: string) => {
    rows.push({ offset, value: buf[offset], color, field });
    offset++;
  };

  if (buf.length === 0) return { rows, truncated: false, dataStartByte: 0 };

  // ── [1] Extension length (1 byte) ────────────────────────────────────────
  const extLen = buf[0];
  push(COLORS.extLen, `[1] EXT LENGTH = ${extLen}`);

  // ── [2] Extension characters (extLen bytes) ───────────────────────────────
  for (let i = 0; i < extLen && offset < buf.length; i++) {
    const ch = String.fromCharCode(buf[offset]);
    push(COLORS.extChar, `[2] EXT[${i}] = '${ch}' (0x${buf[offset - 1].toString(16).toUpperCase().padStart(2, '0')})`);
  }

  // ── [3] Original file size (4 bytes, big-endian) ──────────────────────────
  // Reconstruct the 32-bit value for the annotation on the last byte
  const sizeBytes = [buf[offset], buf[offset+1], buf[offset+2], buf[offset+3]];
  const origSize = sizeBytes.reduce((acc, b, i) => acc + (b ?? 0) * Math.pow(256, 3 - i), 0);
  for (let i = 0; i < 4 && offset < buf.length; i++) {
    const isLast = i === 3;
    push(COLORS.origSize, `[3] ORIG SIZE (byte ${i}/4)${isLast ? ` = ${origSize.toLocaleString()} bytes` : ''}`);
  }

  // ── [4] Tree bit count (4 bytes, big-endian) ──────────────────────────────
  const treeLenBytes = [buf[offset], buf[offset+1], buf[offset+2], buf[offset+3]];
  const treeLen = treeLenBytes.reduce((acc, b, i) => acc + (b ?? 0) * Math.pow(256, 3 - i), 0);
  for (let i = 0; i < 4 && offset < buf.length; i++) {
    const isLast = i === 3;
    push(COLORS.treeLen, `[4] TREE BITS (byte ${i}/4)${isLast ? ` = ${treeLen.toLocaleString()} bits` : ''}`);
  }

  // ── [5] Serialised tree bytes ─────────────────────────────────────────────
  const treeBytesCount = Math.ceil(treeLen / 8);
  const treeEnd = offset + treeBytesCount;

  let treeRowsShown = 0;
  while (offset < treeEnd && offset < buf.length) {
    if (treeRowsShown >= MAX_TREE_ROWS) {
      truncated = true;
      break;
    }
    push(COLORS.treeData, `[5] TREE DATA (byte ${treeRowsShown + 1}/${treeBytesCount})`);
    treeRowsShown++;
  }

  // Skip any remaining tree bytes we didn't display
  if (offset < treeEnd) offset = treeEnd;

  // ── [6] Encoded data bytes ────────────────────────────────────────────────
  const dataStartByte = offset;
  let dataRowsShown = 0;
  while (offset < buf.length) {
    if (dataRowsShown >= MAX_DATA_ROWS) {
      truncated = true;
      break;
    }
    push(COLORS.data, `[6] ENCODED DATA (byte ${dataRowsShown + 1})`);
    dataRowsShown++;
  }

  return { rows, truncated, dataStartByte };
}

/**
 * BinDisplay
 *
 * Renders a single byte as 8 colour-coded bits (1 = cyan, 0 = muted grey).
 *
 * @param value - byte value 0–255
 */
function BinDisplay({ value }: { value: number }) {
  const bits = value.toString(2).padStart(8, '0');
  return (
    <span className="rhv-bits">
      {bits.split('').map((b, i) => (
        <span key={i} className={b === '1' ? 'bit-one' : 'bit-zero'}>{b}</span>
      ))}
    </span>
  );
}

/**
 * RawHeaderViewer
 *
 * Parses `buffer` and renders a styled byte-level dump of the .huff header.
 * Each row shows: offset | hex | binary bits | field label.
 *
 * @param buffer - the full .huff file bytes
 */
export function RawHeaderViewer({ buffer }: RawHeaderViewerProps) {
  const { rows, truncated, dataStartByte } = parseHeader(buffer);

  if (buffer.length === 0) {
    return (
      <div className="rhv-container">
        <div className="rhv-header-bar">
          <span className="panel-label">RAW HEADER DATA</span>
        </div>
        <p className="rhv-empty">Empty file — no header bytes to display.</p>
      </div>
    );
  }

  return (
    <div className="rhv-container">
      {/* ── Title bar ─────────────────────────────────────────────────── */}
      <div className="rhv-header-bar">
        <span className="panel-label">RAW HEADER DATA</span>
        <span className="rhv-meta">
          {buffer.length.toLocaleString()} bytes total
        </span>
      </div>

      {/* ── Column headers ────────────────────────────────────────────── */}
      <div className="rhv-col-labels">
        <span className="rhv-col-offset">OFFSET</span>
        <span className="rhv-col-hex">HEX</span>
        <span className="rhv-col-bin">BIN (MSB → LSB)</span>
        <span className="rhv-col-field">FIELD</span>
      </div>

      {/* ── Byte rows ─────────────────────────────────────────────────── */}
      <div className="rhv-rows">
        {rows.map((row, i) => (
          <div
            key={row.offset}
            className="rhv-row"
            style={{
              borderLeftColor: row.color,
              animationDelay: `${i * 20}ms`,
            }}
          >
            {/* Byte address */}
            <span className="rhv-offset rhv-mono">
              0x{row.offset.toString(16).toUpperCase().padStart(4, '0')}
            </span>

            {/* Hex value */}
            <span className="rhv-hex rhv-mono" style={{ color: row.color }}>
              {row.value.toString(16).toUpperCase().padStart(2, '0')}
            </span>

            {/* Binary bits */}
            <BinDisplay value={row.value} />

            {/* Field label */}
            <span className="rhv-field" style={{ color: row.color }}>
              {row.field}
            </span>
          </div>
        ))}

        {/* Truncation notice */}
        {truncated && (
          <div className="rhv-truncated">
            ···  {buffer.length - rows.length} more bytes not shown
          </div>
        )}
      </div>

      {/* ── Field colour legend ────────────────────────────────────────── */}
      <div className="rhv-legend">
        {[
          { color: COLORS.extLen,   label: '[1] Ext length'   },
          { color: COLORS.extChar,  label: '[2] Extension'    },
          { color: COLORS.origSize, label: '[3] Orig size'    },
          { color: COLORS.treeLen,  label: '[4] Tree bits'    },
          { color: COLORS.treeData, label: '[5] Tree data'    },
          { color: COLORS.data,     label: '[6] Encoded data' },
        ].map(({ color, label }) => (
          <span key={label} className="rhv-legend-item">
            <span className="rhv-legend-dot" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
