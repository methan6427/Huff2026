/**
 * HuffmanNode.ts
 *
 * Defines the HuffmanNode type and a factory function for creating nodes.
 * Kept separate so both the MinHeap and the compress/decompress pipelines
 * can import from a single, unambiguous source.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import type { HuffmanNode } from '../types/HuffmanTypes';

/**
 * makeLeaf
 *
 * Creates a leaf node that stores a single byte value.
 * Leaf nodes are the starting material before the tree is assembled.
 *
 * @param char - byte value 0–255
 * @param freq - how many times this byte appears in the file
 * @returns a HuffmanNode with no children
 * Time complexity: O(1)
 */
export function makeLeaf(char: number, freq: number): HuffmanNode {
  return { char, freq, left: null, right: null };
}

/**
 * makeInternal
 *
 * Creates an internal (non-leaf) node by merging two child nodes.
 * The merged frequency is the sum of the children's frequencies —
 * this is exactly the merge step from the lecture whiteboard algorithm.
 *
 * @param left  - left child (lower or equal frequency)
 * @param right - right child
 * @returns a HuffmanNode with char = null and freq = left.freq + right.freq
 * Time complexity: O(1)
 */
export function makeInternal(left: HuffmanNode, right: HuffmanNode): HuffmanNode {
  return { char: null, freq: left.freq + right.freq, left, right };
}

// Re-export the type so callers only need one import
export type { HuffmanNode };
