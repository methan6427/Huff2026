// Decompress a .huff file back to the original file.
import { BitReader } from './BitReader';
import { makeLeaf, makeInternal } from './HuffmanNode';
import type { HuffmanNode } from './HuffmanNode';
import type { DecompressResult } from '../types/HuffmanTypes';

// Read the header information from the .huff file.
function readHeader(reader: BitReader): {
  ext: string;
  originalSize: number;
  treeBitCount: number;
} {
  const extLen = reader.readByte(); // How many chars is the file type?

  // Read the file type.
  let ext = '';
  for (let i = 0; i < extLen; i++) {
    ext += String.fromCharCode(reader.readByte());
  }

  const originalSize = reader.readUint32(); // Original file size.
  const treeBitCount = reader.readUint32(); // How many bits is the tree?

  return { ext, originalSize, treeBitCount };
}

// Rebuild the Huffman tree from the bits in the .huff file.
function rebuildTree(reader: BitReader, treeBitCount: number): HuffmanNode | null {
  if (treeBitCount === 0) return null; // Empty file - no tree.

  // Use a stack to rebuild the tree from the bits.
  const stack: HuffmanNode[] = [];
  let bitsConsumed = 0;

  while (bitsConsumed < treeBitCount) {
    const bit = reader.readBit();
    bitsConsumed++;

    if (bit === 1) {
      // This is a leaf - read the byte value.
      const charByte = reader.readByte();
      bitsConsumed += 8;

      stack.push(makeLeaf(charByte, 0)); // Add the leaf to the stack.
    } else {
      // This is a branch - pop two leaves and join them.
      const right = stack.pop()!; // The right child (on top).
      const left  = stack.pop()!; // The left child (below).

      stack.push(makeInternal(left, right)); // Join and add back to stack.
    }
  }

  return stack.pop() ?? null; // The final root node.
}

// Decode the bits using the tree - 0 goes left, 1 goes right.
function decodeData(
  reader: BitReader,
  root: HuffmanNode,
  originalSize: number
): Uint8Array {
  const output: number[] = [];

  if (root.char !== null) {
    // Special case: only one byte type in the file.
    for (let i = 0; i < originalSize; i++) {
      reader.readBit(); // Read and ignore the bit.
      output.push(root.char);
    }
    return new Uint8Array(output);
  }

  // Walk the tree for each bit to find bytes.
  let current: HuffmanNode = root;

  while (output.length < originalSize) {
    const bit = reader.readBit();

    // Go left for 0, right for 1.
    current = bit === 0 ? current.left! : current.right!;

    if (current.char !== null) {
      // Found a byte - save it and go back to the top.
      output.push(current.char);
      current = root;
    }
  }

  return new Uint8Array(output);
}

// The main decompression function - read header, rebuild tree, and decode.
export function decompress(data: Uint8Array): DecompressResult {
  const reader = new BitReader(data);

  // Read the header information.
  const { ext, originalSize, treeBitCount } = readHeader(reader);

  // Rebuild the tree from the bits.
  const root = rebuildTree(reader, treeBitCount);

  // Handle empty files.
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

  // Decode the bits to get the original file.
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
