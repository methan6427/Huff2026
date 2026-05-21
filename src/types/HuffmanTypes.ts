// All type definitions for the Huffman coding project.

// A node in the Huffman tree (leaf or branch).
export interface HuffmanNode {
  char: number | null; // The byte value for a leaf; null for a branch.
  freq: number;        // How many times this byte appears in the file.
  left: HuffmanNode | null;
  right: HuffmanNode | null;
}

// Results from compression - the compressed file and information about it.
export interface CompressResult {
  buffer: Uint8Array;             // The compressed file bytes.
  codeTable: Map<number, string>; // Each byte value gets a binary code.
  originalSize: number;           // Original file size in bytes.
  compressedSize: number;         // Compressed file size in bytes.
  compressionRatio: number;       // How much smaller the compressed file is (percentage).
  extension: string;              // File type (like .txt or .jpg).
  huffFileName: string;           // Name for download.
  treeSerializedBits: number;     // How many bits the tree uses.
  leafCount: number;              // How many different bytes are in the file.
  freqTable?: Map<number, number>; // How many times each byte appears.
}

// Results from decompression - the original file recovered from a .huff file.
export interface DecompressResult {
  buffer: Uint8Array;       // The recovered original file bytes.
  originalExtension: string; // The file type from the .huff header.
  compressedSize: number;   // Size of the .huff file.
  decompressedSize: number; // Size of the recovered file.
  headerInfo: HeaderInfo;   // Information from the .huff header.
}

// Information stored in the .huff file header.
export interface HeaderInfo {
  extension: string;          // Original file type.
  originalFileSize: number;   // Original file size.
  treeSerializedBits: number; // Bits used for the Huffman tree.
}

// States during compression or decompression.
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
