// Compress a file using Huffman coding and write a .huff file.
import { makeLeaf, makeInternal } from './HuffmanNode';
import { MinHeap } from './MinHeap';
import { BitWriter } from './BitWriter';
import type { HuffmanNode } from './HuffmanNode';
import type { CompressResult } from '../types/HuffmanTypes';

// The .huff file structure: file type + original size + Huffman tree + compressed data.

// Count how many times each byte appears in the file.
function countFrequencies(data: Uint8Array): number[] {
  const freq = new Array<number>(256).fill(0);

  for (const byte of data) {
    freq[byte]++; // Add one to this byte's count.
  }

  return freq;
}

// Build the Huffman tree by joining the rarest bytes first.
function buildTree(freq: number[]): HuffmanNode | null {
  // Create a leaf for each byte that appears in the file.
  const leaves: HuffmanNode[] = [];
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      leaves.push(makeLeaf(i, freq[i]));
    }
  }

  if (leaves.length === 0) return null; // Empty file - no tree.

  if (leaves.length === 1) return leaves[0]; // One byte - just one leaf.

  // Put all leaves in a heap and join them from rarest to most common.
  const heap = new MinHeap();
  heap.buildHeap(leaves);

  const n = leaves.length;

  // Join the two rarest nodes until only one node remains.
  for (let i = 0; i < n - 1; i++) {
    const a = heap.deleteMin(); // The rarest.
    const b = heap.deleteMin(); // The second rarest.

    const z = makeInternal(a, b); // Join them.

    heap.insert(z); // Add the new branch back.
  }

  return heap.deleteMin(); // The final tree root.
}

// Give each byte a binary code - go left for 0, right for 1.
function generateCodes(
  node: HuffmanNode,
  code: string,
  table: Map<number, string>
): void {
  if (node.char !== null) {
    // This is a leaf - save the code.
    table.set(node.char, code.length === 0 ? '0' : code);
    return;
  }

  // Go down both branches and add 0 or 1 to the code.
  generateCodes(node.left!,  code + '0', table);
  generateCodes(node.right!, code + '1', table);
}

// Write the tree as bits: leaves get 1 + the byte, branches get 0.
function serializeTree(node: HuffmanNode | null, writer: BitWriter): void {
  if (node === null) return;

  // Go left first, then right, then write this node.
  serializeTree(node.left,  writer);
  serializeTree(node.right, writer);

  if (node.char !== null) {
    // Leaf node - write 1 and then the byte.
    writer.writeBit(1);
    writer.writeByte(node.char);
  } else {
    // Branch node - write 0.
    writer.writeBit(0);
  }
}

// The main compression function - count, build tree, and create the .huff file.
export function compress(data: Uint8Array, fileName: string): CompressResult {
  // Get the file type from the file name.
  const dotIndex = fileName.lastIndexOf('.');
  const ext = dotIndex >= 0 ? fileName.slice(dotIndex + 1) : '';

  // Count how many times each byte appears.
  const freq = countFrequencies(data);

  // Handle empty file.
  if (data.length === 0) {
    const writer = new BitWriter();
    writer.writeByte(ext.length);
    for (const ch of ext) writer.writeByte(ch.charCodeAt(0));
    writer.writeUint32(0);
    writer.writeUint32(0);
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

  // Build the tree by joining rarest bytes first.
  const root = buildTree(freq)!;

  // Give each byte its code.
  const codeTable = new Map<number, string>();
  generateCodes(root, '', codeTable);

  // Write the tree once to see how big it is.
  const tempTreeWriter = new BitWriter();
  serializeTree(root, tempTreeWriter);
  const treeBitCount = tempTreeWriter.getBitCount();

  // Write the full .huff file with header and compressed data.
  const writer = new BitWriter();

  writer.writeByte(ext.length); // File type length.
  for (const ch of ext) {
    writer.writeByte(ch.charCodeAt(0)); // File type chars.
  }
  writer.writeUint32(data.length); // Original file size.
  writer.writeUint32(treeBitCount); // Tree size in bits.
  serializeTree(root, writer); // The tree.

  // Compress each byte using its code.
  for (const byte of data) {
    const code = codeTable.get(byte)!;
    for (const bit of code) {
      writer.writeBit(bit === '1' ? 1 : 0);
    }
  }

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
