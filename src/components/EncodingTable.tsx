/**
 * EncodingTable.tsx
 *
 * Displays the Huffman code table: each unique byte value in the file
 * mapped to its binary code string. Rows fade in with a staggered animation
 * to create a "data-loading" terminal effect.
 *
 * This is the "money shot" of the UI — it must look impressive.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

interface EncodingTableProps {
  codeTable: Map<number, string>; // byte value (0–255) → Huffman code string
}

/**
 * charDisplay
 *
 * Returns a human-readable label for a byte value.
 * Printable ASCII (32–126) are shown as their character.
 * Control characters and high bytes are shown as hex (e.g. 0x00, 0x0A).
 *
 * @param byte - byte value 0–255
 * @returns string label
 */
function charDisplay(byte: number): string {
  if (byte >= 32 && byte <= 126) return String.fromCharCode(byte);
  // Named control characters for readability
  const named: Record<number, string> = {
    0: 'NUL', 9: 'TAB', 10: 'LF', 13: 'CR', 27: 'ESC', 32: 'SPC',
  };
  return named[byte] ?? `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`;
}

/**
 * EncodingTable
 *
 * Renders a scrollable table of all Huffman codes, sorted by byte value.
 * Each row includes: byte value (dec + hex), character label, code length, and code.
 * Rows animate in with a staggered CSS animation delay for a terminal reveal effect.
 *
 * @param codeTable - map from byte value to binary code string
 */
export function EncodingTable({ codeTable }: EncodingTableProps) {
  // Sort entries by byte value (0–255) for consistent ordering
  const entries = [...codeTable.entries()].sort(([a], [b]) => a - b);

  if (entries.length === 0) {
    return (
      <div className="encoding-table-empty">
        <span>NO DATA</span>
      </div>
    );
  }

  return (
    <div className="encoding-table-container">
      <div className="encoding-table-header">
        <span className="panel-label">ENCODING TABLE</span>
        <span className="encoding-table-count">{entries.length} symbols</span>
      </div>

      <div className="encoding-table-scroll">
        <table className="encoding-table">
          <thead>
            <tr>
              <th>DEC</th>
              <th>HEX</th>
              <th>CHAR</th>
              <th>BITS</th>
              <th>CODE</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([byte, code], index) => (
              <tr
                key={byte}
                className="encoding-row"
                // Staggered fade-in: each row appears 15 ms after the previous
                style={{ animationDelay: `${index * 15}ms` }}
              >
                <td className="col-dec">{byte}</td>
                <td className="col-hex">
                  {byte.toString(16).padStart(2, '0').toUpperCase()}
                </td>
                <td className="col-char">{charDisplay(byte)}</td>
                <td className="col-len">{code.length}</td>
                <td className="col-code">
                  {/* Colour-code 0s and 1s for instant readability */}
                  {code.split('').map((bit, i) => (
                    <span key={i} className={bit === '1' ? 'bit-one' : 'bit-zero'}>
                      {bit}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
