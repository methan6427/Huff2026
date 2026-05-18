/**
 * EncodingTable.tsx
 *
 * Displays the Huffman code table: each unique byte value mapped to its
 * binary code string. Rows are sorted by frequency descending so that
 * the most common bytes — which get the shortest codes — appear first.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

interface EncodingTableProps {
  codeTable: Map<number, string>;   // byte value (0–255) → Huffman code string
  freqTable?: Map<number, number>;  // byte value → frequency count (for sorting)
  originalSize?: number;            // not used for display, kept for API compat
}

/**
 * charDisplay
 *
 * Returns a human-readable label for a byte value.
 * Printable ASCII (32–126) shown as their character; others as hex.
 *
 * @param byte - byte value 0–255
 * @returns string label
 * Time complexity: O(1)
 */
function charDisplay(byte: number): string {
  if (byte >= 32 && byte <= 126) return String.fromCharCode(byte);
  const named: Record<number, string> = {
    0: 'NUL', 9: 'TAB', 10: 'LF', 13: 'CR', 27: 'ESC',
  };
  return named[byte] ?? `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`;
}

/**
 * EncodingTable
 *
 * Scrollable table of all Huffman codes sorted by frequency descending.
 * Each row shows: dec, hex, char label, frequency (if available), code length, code.
 * 1-bits are coloured blue, 0-bits are grey to make patterns easy to scan.
 *
 * @param codeTable   - map from byte value to binary code string
 * @param freqTable   - optional frequency map used for sorting
 * Time complexity: O(n log n) due to sort
 */
export function EncodingTable({ codeTable, freqTable }: EncodingTableProps) {
  // Sort by frequency descending; fall back to code-length ascending when no freqTable.
  // Either way the top rows have the shortest codes, showing Huffman's core property.
  const entries = [...codeTable.entries()].sort(([aB, aC], [bB, bC]) => {
    if (freqTable) {
      const freqDiff = (freqTable.get(bB) ?? 0) - (freqTable.get(aB) ?? 0);
      if (freqDiff !== 0) return freqDiff;
    }
    return aC.length - bC.length;
  });

  if (entries.length === 0) {
    return (
      <div className="encoding-table-empty">No data</div>
    );
  }

  return (
    <div className="encoding-table-container">
      <div className="encoding-table-header">
        <span className="panel-label">Encoding Table</span>
        <span className="encoding-table-count">{entries.length} symbols</span>
      </div>

      <div className="encoding-table-scroll">
        <table className="encoding-table">
          <thead>
            <tr>
              <th>Dec</th>
              <th>Hex</th>
              <th>Char</th>
              {freqTable && <th>Freq</th>}
              <th>Bits</th>
              <th>Code</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([byte, code], index) => (
              <tr
                key={byte}
                className="encoding-row"
                style={{ animationDelay: `${index * 12}ms` }}
              >
                <td className="col-dec">{byte}</td>
                <td className="col-hex">
                  {byte.toString(16).padStart(2, '0').toUpperCase()}
                </td>
                <td className="col-char">{charDisplay(byte)}</td>
                {freqTable && (
                  <td className="col-freq">
                    {(freqTable.get(byte) ?? 0).toLocaleString()}
                  </td>
                )}
                <td className="col-len">{code.length}</td>
                <td className="col-code">
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
