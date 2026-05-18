/**
 * HeaderDisplay.tsx
 *
 * Visualises the .huff file header as a protocol table.
 * Shows all 5 header fields with their number, name, bit-width,
 * actual value, and a short description.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

interface HeaderDisplayProps {
  extension: string;
  originalFileSize: number;
  treeSerializedBits: number;
  leafCount?: number;
}

// One accent colour per field for quick visual scanning
const FIELD_COLORS = [
  'var(--accent-primary)',  // [1] extension length
  '#7EB8FF',                // [2] extension chars
  'var(--accent-warning)',  // [3] original file size
  '#FF7EB8',                // [4] tree bit length
  'var(--accent-success)',  // [5] serialised tree
] as const;

/**
 * FieldRow
 *
 * One row in the protocol table: field number, name, bit-width, value, description.
 *
 * @param num    - e.g. "[3]"
 * @param name   - field name
 * @param bits   - bit-width string
 * @param value  - actual value from the file
 * @param why    - short description
 * @param accent - left-border and bit-width colour
 * Time complexity: O(1)
 */
function FieldRow({
  num, name, bits, value, why, accent,
}: {
  num: string; name: string; bits: string;
  value: string; why: string; accent: string;
}) {
  return (
    <tr className="hd-proto-row" style={{ borderLeftColor: accent }}>
      <td className="hd-proto-num"  style={{ color: accent }}>{num}</td>
      <td className="hd-proto-name">{name}</td>
      <td className="hd-proto-bits" style={{ color: accent }}>{bits}</td>
      <td className="hd-proto-value">{value}</td>
      <td className="hd-proto-why">{why}</td>
    </tr>
  );
}

/**
 * HeaderDisplay
 *
 * Protocol table for the .huff file header showing all 5 fields.
 *
 * @param extension          - original file extension stored in the header
 * @param originalFileSize   - original file size in bytes (header field [3])
 * @param treeSerializedBits - bit count of the serialised Huffman tree (header field [4])
 * @param leafCount          - number of unique bytes in the file (optional, for display)
 * Time complexity: O(1)
 */
export function HeaderDisplay({
  extension,
  originalFileSize,
  treeSerializedBits,
  leafCount,
}: HeaderDisplayProps) {
  const extBits = extension.length * 8;
  const headerTotalBits = 8 + extBits + 32 + 32 + treeSerializedBits;
  const headerBytes = Math.ceil(headerTotalBits / 8);

  const extValueStr = extension.length > 0
    ? `"${extension.toUpperCase()}" (${extension.length} char${extension.length !== 1 ? 's' : ''})`
    : '(no extension)';

  const treeValueStr = leafCount !== undefined
    ? `${treeSerializedBits} bits · ${leafCount} leaves`
    : `${treeSerializedBits} bits`;

  return (
    <div className="header-display-container">
      <div className="header-display-title">
        <span className="panel-label">Header Structure</span>
        <span className="header-display-overhead">{headerBytes} bytes overhead</span>
      </div>

      <div className="hd-proto-wrapper">
        <table className="hd-proto-table">
          <thead>
            <tr className="hd-proto-thead">
              <th className="hd-proto-th hd-th-num">#</th>
              <th className="hd-proto-th hd-th-name">Field</th>
              <th className="hd-proto-th hd-th-bits">Bits</th>
              <th className="hd-proto-th hd-th-value">Value</th>
              <th className="hd-proto-th hd-th-why">Description</th>
            </tr>
          </thead>
          <tbody>
            <FieldRow
              num="[1]"
              name="Extension length"
              bits="8"
              value={`${extension.length}`}
              why="Number of ASCII bytes that follow in field [2]."
              accent={FIELD_COLORS[0]}
            />
            <FieldRow
              num="[2]"
              name="Extension chars"
              bits={`${extBits}`}
              value={extValueStr}
              why="Original file extension, used to name the decoded output file."
              accent={FIELD_COLORS[1]}
            />
            <FieldRow
              num="[3]"
              name="Original file size"
              bits="32"
              value={`${originalFileSize.toLocaleString()} bytes`}
              why="Stored so the decoder knows exactly how many bytes to output and stops before reading padding zeros."
              accent={FIELD_COLORS[2]}
            />
            <FieldRow
              num="[4]"
              name="Tree bit length"
              bits="32"
              value={`${treeSerializedBits} bits`}
              why="Number of bits the serialised tree occupies; decoder reads exactly this many bits for field [5]."
              accent={FIELD_COLORS[3]}
            />
            <FieldRow
              num="[5]"
              name="Serialised tree"
              bits={`${treeSerializedBits}`}
              value={treeValueStr}
              why="PostOrder traversal (Left→Right→Root). Leaf = 1 + 8-bit char. Internal node = 0. Rebuilt in decoder using an explicit stack."
              accent={FIELD_COLORS[4]}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
