/**
 * HuffmanTypes.ts
 *
 * Shared TypeScript interfaces and types for the Huffman coding project.
 * Centralises all type definitions so every module imports from one place.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

// ── Tree node ────────────────────────────────────────────────────────────────

/**
 * HuffmanNode
 *
 * Represents a single node in the Huffman binary tree.
 * Leaf nodes store an actual byte value (0–255) in `char`.
 * Internal nodes have char = null and two non-null children.
 */
export interface HuffmanNode {
  char: number | null; // byte value for leaves; null for internal nodes
  freq: number;        // frequency count used when building the tree
  left: HuffmanNode | null;
  right: HuffmanNode | null;
}

// ── Compression result ───────────────────────────────────────────────────────

/**
 * CompressResult
 *
 * Everything produced by the compression pipeline:
 * the output buffer, the code table, and statistics.
 */
export interface CompressResult {
  buffer: Uint8Array;             // the final .huff file bytes
  codeTable: Map<number, string>; // byte value → binary code string (e.g. "1010")
  originalSize: number;           // input file size in bytes
  compressedSize: number;         // output .huff file size in bytes
  compressionRatio: number;       // compressedSize / originalSize * 100 (percentage)
  extension: string;              // original file extension (e.g. "txt")
  huffFileName: string;           // suggested download filename
  treeSerializedBits: number;     // how many bits the serialised tree occupies
  leafCount: number;              // number of unique byte values in the file
}

// ── Decompression result ─────────────────────────────────────────────────────

/**
 * DecompressResult
 *
 * Everything produced by the decompression pipeline.
 */
export interface DecompressResult {
  buffer: Uint8Array;       // the reconstructed original file bytes
  originalExtension: string; // extension recovered from the header
  compressedSize: number;   // size of the .huff input in bytes
  decompressedSize: number; // size of the recovered file in bytes
  headerInfo: HeaderInfo;   // parsed header fields for display
}

/**
 * HeaderInfo
 *
 * The parsed header fields from a .huff file, shown in the HeaderDisplay component.
 */
export interface HeaderInfo {
  extension: string;          // original file extension
  originalFileSize: number;   // original file size stored in header (32-bit field)
  treeSerializedBits: number; // bit count of the serialised tree (32-bit field)
}

// ── Hook state types ─────────────────────────────────────────────────────────

export type ProcessStatus = 'idle' | 'processing' | 'done' | 'error';

export interface CompressorState {
  status: ProcessStatus;
  result?: CompressResult;
  error?: string;
}

export interface DecompressorState {
  status: ProcessStatus;
  result?: DecompressResult;
  rawHuffBuffer?: Uint8Array; // the original .huff bytes, kept for RawHeaderViewer
  error?: string;
}
