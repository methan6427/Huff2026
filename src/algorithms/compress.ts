/**
 * compress.ts
 *
 * Full Huffman compression pipeline: reads raw bytes, builds the tree,
 * serialises it, and writes the complete .huff binary format.
 * Implements exactly the algorithm from the COM336 lecture whiteboard.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { makeLeaf, makeInternal } from './HuffmanNode';
import { MinHeap } from './MinHeap';
import { BitWriter } from './BitWriter';
import type { HuffmanNode } from './HuffmanNode';
import type { CompressResult } from '../types/HuffmanTypes';

// ── .huff header layout (must match decompress.ts exactly) ──────────────────
//
//  [1]  8 bits  — number of characters in the file extension
//  [2]  8 bits per char — extension characters (ASCII)
//  [3]  32 bits — original file size in bytes (needed to stop decoding)
//  [4]  32 bits — number of bits in the serialised Huffman tree
//  [5]  N bits  — the serialised Huffman tree (PostOrder: leaf=1+8bits, internal=0)
//  [6]  remaining bits — Huffman-encoded file content (padded to full byte)
//
// Fields [3] and [6] are added alongside the lecture-required fields to make
// decompression exact: without [3] the decoder cannot know when to stop,
// and the standard approach is to store the original size in the header.

// ── Step 1: Count byte frequencies ──────────────────────────────────────────

/**
 * countFrequencies
 *
 * Counts how many times each byte value (0–255) appears in the file.
 * This is exactly the algorithm the instructor wrote on the board:
 *   while not eof(file): ch = readByte(); freq[ch] = freq[ch] + 1
 *
 * @param data - raw file bytes
 * @returns freq array indexed by byte value (0–255)
 * Time complexity: O(n) where n = file size in bytes
 */
function countFrequencies(data: Uint8Array): number[] {
  const freq = new Array<number>(256).fill(0);

  // Iterate every byte and increment its frequency bucket
  for (const byte of data) {
    freq[byte]++;
  }

  return freq;
}

// ── Step 2: Build the Huffman tree ───────────────────────────────────────────

/**
 * buildTree
 *
 * Constructs the Huffman tree from a frequency table.
 * Implements the whiteboard algorithm from the COM336 lecture:
 *
 *   n = number of unique bytes (leaves)
 *   Build_Heap(H) from all leaf nodes        — O(n)
 *   for i = 1 to n-1 do:
 *     Z = newNode()
 *     A = DeleteMin(H)                       — O(log n)
 *     B = DeleteMin(H)                       — O(log n)
 *     Z.freq = A.freq + B.freq
 *     Z.left = A;  Z.right = B
 *     Insert(H, Z)                           — O(log n)
 *   endfor
 *   T(n) = O(n log n)
 *
 * @param freq - frequency array from countFrequencies
 * @returns the root of the Huffman tree (or null if the file is empty)
 * Time complexity: O(n log n)
 */
function buildTree(freq: number[]): HuffmanNode | null {
  // Create leaf nodes for every byte that actually appears in the file
  const leaves: HuffmanNode[] = [];
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      leaves.push(makeLeaf(i, freq[i]));
    }
  }

  if (leaves.length === 0) return null; // empty file — no tree

  // Edge case: only one unique byte value in the file.
  // The single leaf becomes the root; we assign it code '0' later.
  if (leaves.length === 1) return leaves[0];

  // Build the min-heap from all leaves in O(n) time
  const heap = new MinHeap();
  heap.buildHeap(leaves);

  const n = leaves.length;

  // Perform n-1 merge steps to reduce the heap to a single root node
  for (let i = 0; i < n - 1; i++) {
    const a = heap.deleteMin(); // least frequent node  — O(log n)
    const b = heap.deleteMin(); // second least frequent — O(log n)

    // Create an internal node whose frequency is the sum of its children
    const z = makeInternal(a, b);

    heap.insert(z); // re-insert the merged node — O(log n)
  }

  // The heap now contains exactly one node: the root of the complete tree
  return heap.deleteMin();
}

// ── Step 3: Generate the encoding table ─────────────────────────────────────

/**
 * generateCodes
 *
 * Traverses the Huffman tree recursively to produce a code for every leaf.
 * Going left appends '0'; going right appends '1'.
 * At a leaf the current code string is stored in the table.
 *
 * This traversal uses recursion, which is internally backed by the call stack.
 * (The instructor's comment: "How does recursion work? — It uses the call stack."
 *  The decompression step makes this explicit by using a manual stack instead.)
 *
 * @param node  - current tree node
 * @param code  - code accumulated so far from the root
 * @param table - output map: byte value → code string (e.g. "1010")
 * Time complexity: O(n) total for the whole tree traversal
 */
function generateCodes(
  node: HuffmanNode,
  code: string,
  table: Map<number, string>
): void {
  if (node.char !== null) {
    // Leaf node — store the code.
    // If this leaf IS the root (single unique byte), code is '' so we assign '0'.
    table.set(node.char, code.length === 0 ? '0' : code);
    return;
  }

  // Recurse into children: left = '0', right = '1'
  generateCodes(node.left!,  code + '0', table);
  generateCodes(node.right!, code + '1', table);
}

// ── Step 4: Serialise the Huffman tree (PostOrder) ───────────────────────────

/**
 * serializeTree
 *
 * Writes the tree to a BitWriter using PostOrder traversal (Left → Right → Root).
 * This is the exact serialisation format from the COM336 lecture:
 *
 *   function serializePostOrder(node, bitWriter):
 *     if node is null: return
 *     serializePostOrder(node.left,  bitWriter)   — Left
 *     serializePostOrder(node.right, bitWriter)   — Right
 *     if node is leaf:                            — Root
 *       bitWriter.writeBit(1)
 *       bitWriter.writeByte(node.char)
 *     else:
 *       bitWriter.writeBit(0)
 *
 * Leaf marker = 1 followed by 8 bits of the byte value (9 bits total per leaf).
 * Internal node marker = 0 (1 bit total per internal node).
 *
 * @param node   - current tree node (null terminates recursion)
 * @param writer - BitWriter to receive the serialised bits
 * Time complexity: O(k) where k = number of nodes in the tree (≤ 511)
 */
function serializeTree(node: HuffmanNode | null, writer: BitWriter): void {
  if (node === null) return;

  // PostOrder: Left → Right → Root
  serializeTree(node.left,  writer);
  serializeTree(node.right, writer);

  if (node.char !== null) {
    // Leaf: write marker bit 1, then the byte value (8 bits)
    writer.writeBit(1);
    writer.writeByte(node.char);
  } else {
    // Internal node: write marker bit 0
    writer.writeBit(0);
  }
}

// ── Step 5: Build the .huff binary buffer ────────────────────────────────────

/**
 * compress
 *
 * Full compression pipeline. Reads raw file bytes and returns a CompressResult
 * containing the .huff binary buffer and all statistics for the UI.
 *
 * Header layout (see constant above for field descriptions):
 *   ext length (8) | ext chars (8×len) | orig size (32) | tree bits (32) | tree | data
 *
 * @param data     - raw input file as Uint8Array
 * @param fileName - original file name (used to extract the extension)
 * @returns CompressResult with buffer, codeTable, and statistics
 * Time complexity: O(n log n) dominated by tree construction
 */
export function compress(data: Uint8Array, fileName: string): CompressResult {
  // Extract the file extension (without the leading dot, upper-cased for the header)
  const dotIndex = fileName.lastIndexOf('.');
  const ext = dotIndex >= 0 ? fileName.slice(dotIndex + 1) : '';

  // ── Step 1: Frequency count ────────────────────────────────────────────────
  const freq = countFrequencies(data);

  // Handle empty file: produce a minimal header with no tree and no data
  if (data.length === 0) {
    const writer = new BitWriter();
    writer.writeByte(ext.length);           // extension length
    for (const ch of ext) writer.writeByte(ch.charCodeAt(0));
    writer.writeUint32(0);                  // original size = 0
    writer.writeUint32(0);                  // tree bit length = 0
    const buffer = writer.toUint8Array();
    return {
      buffer,
      codeTable: new Map(),
      originalSize: 0,
      compressedSize: buffer.length,
      compressionRatio: 100,
      extension: ext,
      huffFileName: (fileName || 'file') + '.huff',
      treeSerializedBits: 0,
      leafCount: 0,
    };
  }

  // ── Step 2: Build the Huffman tree ────────────────────────────────────────
  const root = buildTree(freq)!; // non-null because data.length > 0

  // ── Step 3: Generate the code table ──────────────────────────────────────
  const codeTable = new Map<number, string>();
  generateCodes(root, '', codeTable);

  // ── Step 4: Serialise the tree to measure its bit length ─────────────────
  // We serialise once into a temporary writer to get the exact bit count,
  // then serialise again directly into the main writer.
  // The tree is small (≤ 256 leaves × 9 bits + 255 internal × 1 bit ≈ 2559 bits),
  // so the double-pass overhead is negligible.
  const tempTreeWriter = new BitWriter();
  serializeTree(root, tempTreeWriter);
  const treeBitCount = tempTreeWriter.getBitCount();

  // ── Step 5: Write the complete .huff header + data ───────────────────────
  const writer = new BitWriter();

  // [1] Extension length (8 bits) — how many ASCII chars follow
  writer.writeByte(ext.length);

  // [2] Extension characters (8 bits each)
  for (const ch of ext) {
    writer.writeByte(ch.charCodeAt(0));
  }

  // [3] Original file size in bytes (32 bits) — decoder uses this to stop
  writer.writeUint32(data.length);

  // [4] Tree bit length (32 bits) — decoder reads exactly this many bits for the tree
  writer.writeUint32(treeBitCount);

  // [5] Serialised Huffman tree (treeBitCount bits, PostOrder)
  serializeTree(root, writer);

  // [6] Encoded file content — each input byte is replaced by its Huffman code
  for (const byte of data) {
    const code = codeTable.get(byte)!;
    for (const bit of code) {
      writer.writeBit(bit === '1' ? 1 : 0);
    }
  }

  // Finalise: pad the last byte with 0-bits (decoder ignores them)
  const buffer = writer.toUint8Array();

  const leafCount = [...codeTable.keys()].length;

  return {
    buffer,
    codeTable,
    originalSize: data.length,
    compressedSize: buffer.length,
    compressionRatio: Math.round((buffer.length / data.length) * 10000) / 100,
    extension: ext,
    huffFileName: fileName + '.huff',
    treeSerializedBits: treeBitCount,
    leafCount,
  };
}
