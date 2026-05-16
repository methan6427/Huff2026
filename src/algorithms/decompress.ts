/**
 * decompress.ts
 *
 * Full Huffman decompression pipeline: reads a .huff file, reconstructs the
 * Huffman tree using a manual stack, then decodes the bit stream back to the
 * original bytes.
 *
 * The tree-rebuild step deliberately uses an explicit Stack<HuffmanNode>
 * (not recursion) — the instructor specifically explained this technique and
 * will ask about it in the discussion.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { BitReader } from './BitReader';
import { makeLeaf, makeInternal } from './HuffmanNode';
import type { HuffmanNode } from './HuffmanNode';
import type { DecompressResult } from '../types/HuffmanTypes';

// ── Step 1: Read the header ──────────────────────────────────────────────────

/**
 * readHeader
 *
 * Reads the .huff header fields in the exact order they were written by compress.ts.
 *
 * Header layout:
 *   [1]  8 bits  — extension length
 *   [2]  8 bits per char — extension string
 *   [3]  32 bits — original file size in bytes
 *   [4]  32 bits — number of bits in the serialised Huffman tree
 *
 * @param reader - BitReader positioned at the very beginning of the file
 * @returns parsed header values
 * Time complexity: O(ext.length) — effectively O(1) since ext ≤ ~10 chars
 */
function readHeader(reader: BitReader): {
  ext: string;
  originalSize: number;
  treeBitCount: number;
} {
  // [1] Read extension length (8 bits)
  const extLen = reader.readByte();

  // [2] Read extension characters (8 bits each), reconstruct as a string
  let ext = '';
  for (let i = 0; i < extLen; i++) {
    ext += String.fromCharCode(reader.readByte());
  }

  // [3] Read original file size (32 bits) — used to know when decoding is complete
  const originalSize = reader.readUint32();

  // [4] Read the number of bits the serialised tree occupies (32 bits)
  const treeBitCount = reader.readUint32();

  return { ext, originalSize, treeBitCount };
}

// ── Step 2: Rebuild the Huffman tree using an explicit Stack ─────────────────

/**
 * rebuildTree
 *
 * Reconstructs the Huffman tree from the PostOrder bit stream using a manual stack.
 *
 * WHY A STACK?
 * PostOrder serialisation (Left → Right → Root) writes left subtrees first,
 * then right subtrees, then the root marker.
 * A stack is LIFO (Last In, First Out).
 * When reading back:
 *   - A leaf (bit=1) is pushed immediately.
 *   - An internal marker (bit=0) pops TWO nodes: the RIGHT child is on top
 *     (it was pushed last, after the left subtree), and the LEFT child is below.
 * This naturally reconstructs the original tree structure.
 *
 * The instructor specifically explained this algorithm and will ask:
 *   Q: "Why a stack for decompression?"
 *   A: Because it is LIFO. PostOrder wrote left first, so left was pushed first.
 *      Popping gives right first (top of stack), then left — correct for merging.
 *
 * Algorithm (from the lecture):
 *   stack = new Stack<HuffmanNode>()
 *   while treeData has more bits:
 *     bit = readBit()
 *     if bit === 1:  (leaf)
 *       charByte = readByte()
 *       stack.push(leaf(charByte))
 *     if bit === 0:  (internal)
 *       right = stack.pop()   ← first pop = right (LIFO)
 *       left  = stack.pop()   ← second pop = left
 *       stack.push(internal(left, right))
 *   root = stack.pop()
 *
 * @param reader      - BitReader positioned just after the header
 * @param treeBitCount - exact number of bits to read for the tree
 * @returns the reconstructed root HuffmanNode
 * Time complexity: O(k) where k = number of tree nodes (≤ 511)
 */
function rebuildTree(reader: BitReader, treeBitCount: number): HuffmanNode | null {
  if (treeBitCount === 0) return null; // empty file had no tree

  // The explicit stack — JavaScript arrays provide push() and pop() with O(1) amortised
  const stack: HuffmanNode[] = [];

  let bitsConsumed = 0; // track how many tree bits have been read

  while (bitsConsumed < treeBitCount) {
    const bit = reader.readBit();
    bitsConsumed++;

    if (bit === 1) {
      // Leaf node: read the 8-bit character value
      const charByte = reader.readByte();
      bitsConsumed += 8; // 8 additional bits for the character

      // Create a leaf and push it — it will become a child of an internal node later
      stack.push(makeLeaf(charByte, 0));
    } else {
      // Internal node: pop two children from the stack.
      //
      // CRITICAL — pop order matters (LIFO):
      //   PostOrder wrote left subtree first, so left was pushed first.
      //   Therefore RIGHT is on top of the stack (pushed last) → pop right first.
      //   LEFT is below right → pop left second.
      //
      // This is exactly how the instructor explained the LIFO relationship.
      const right = stack.pop()!; // first pop  = right child (top of stack)
      const left  = stack.pop()!; // second pop = left child  (below right)

      // Merge into an internal node and push back
      stack.push(makeInternal(left, right));
    }
  }

  // When done, the stack contains exactly one node: the root of the tree
  return stack.pop() ?? null;
}

// ── Step 3: Decode the bit stream ────────────────────────────────────────────

/**
 * decodeData
 *
 * Walks the Huffman tree bit by bit to recover the original bytes.
 *   0 → go left
 *   1 → go right
 *   leaf reached → emit node.char, return to root
 *
 * Stops after emitting `originalSize` bytes (ignores trailing padding bits).
 *
 * @param reader       - BitReader positioned after the serialised tree
 * @param root         - root of the reconstructed Huffman tree
 * @param originalSize - number of bytes to decode (from the header)
 * @returns Uint8Array of the reconstructed original file bytes
 * Time complexity: O(n × d) where n = original byte count, d = average code depth
 */
function decodeData(
  reader: BitReader,
  root: HuffmanNode,
  originalSize: number
): Uint8Array {
  const output: number[] = [];

  if (root.char !== null) {
    // Special case: tree has a single leaf (file had only one unique byte).
    // Every bit in the data stream encodes one occurrence of that byte.
    for (let i = 0; i < originalSize; i++) {
      reader.readBit(); // consume the '0' bit (code was assigned as '0')
      output.push(root.char);
    }
    return new Uint8Array(output);
  }

  // General case: walk the tree for each bit until we have all original bytes
  let current: HuffmanNode = root;

  while (output.length < originalSize) {
    const bit = reader.readBit();

    // Navigate the tree: 0 → left branch, 1 → right branch
    current = bit === 0 ? current.left! : current.right!;

    if (current.char !== null) {
      // Arrived at a leaf — emit the decoded byte and return to root
      output.push(current.char);
      current = root;
    }
  }

  return new Uint8Array(output);
}

// ── Main entry point ─────────────────────────────────────────────────────────

/**
 * decompress
 *
 * Full decompression pipeline. Reads a .huff Uint8Array and returns the
 * original file bytes plus metadata for the UI.
 *
 * @param data     - raw bytes of the .huff file
 * @returns DecompressResult with the recovered file and statistics
 * Time complexity: O(n) where n = original file size in bytes
 */
export function decompress(data: Uint8Array): DecompressResult {
  const reader = new BitReader(data);

  // ── Step 1: Parse the header ───────────────────────────────────────────────
  const { ext, originalSize, treeBitCount } = readHeader(reader);

  // ── Step 2: Rebuild the Huffman tree ──────────────────────────────────────
  const root = rebuildTree(reader, treeBitCount);

  // Handle the edge case of an empty file
  if (root === null || originalSize === 0) {
    return {
      buffer: new Uint8Array(0),
      originalExtension: ext,
      compressedSize: data.length,
      decompressedSize: 0,
      headerInfo: {
        extension: ext,
        originalFileSize: 0,
        treeSerializedBits: treeBitCount,
      },
    };
  }

  // ── Step 3: Decode the bit stream ─────────────────────────────────────────
  const buffer = decodeData(reader, root, originalSize);

  return {
    buffer,
    originalExtension: ext,
    compressedSize: data.length,
    decompressedSize: buffer.length,
    headerInfo: {
      extension: ext,
      originalFileSize: originalSize,
      treeSerializedBits: treeBitCount,
    },
  };
}
