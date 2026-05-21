// Functions to create tree nodes for the Huffman algorithm.
import type { HuffmanNode } from '../types/HuffmanTypes';

// Create a leaf node for one byte value with its frequency.
export function makeLeaf(char: number, freq: number): HuffmanNode {
  return { char, freq, left: null, right: null };
}

// Create a branch node by joining two child nodes and adding their frequencies.
export function makeInternal(left: HuffmanNode, right: HuffmanNode): HuffmanNode {
  return { char: null, freq: left.freq + right.freq, left, right };
}

// Re-export the type so callers only need one import
export type { HuffmanNode };
