/**
 * MinHeap.ts
 *
 * A classic min-heap (priority queue) ordered by node frequency.
 * Used by the Huffman tree builder to always merge the two least-frequent nodes.
 * Implements the exact interface required by the COM336 lecture algorithm.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import type { HuffmanNode } from '../types/HuffmanTypes';

/**
 * MinHeap
 *
 * Binary min-heap backed by an array. The heap property: every parent
 * has a frequency ≤ both of its children. The smallest-frequency node
 * is always at index 0 (the root of the heap array).
 *
 * Array indexing (0-based):
 *   parent of i  → Math.floor((i - 1) / 2)
 *   left child   → 2i + 1
 *   right child  → 2i + 2
 */
export class MinHeap {
  // The internal array — satisfies the heap property at all times
  private heap: HuffmanNode[] = [];

  /**
   * insert
   *
   * Adds a node to the heap, then restores the heap property by
   * "bubbling up" — swapping the new node with its parent while
   * the parent's frequency is larger (O(log n) swaps in the worst case).
   *
   * @param node - the node to insert
   * Time complexity: O(log n)
   */
  insert(node: HuffmanNode): void {
    this.heap.push(node); // append at the end (may violate heap property)
    this.bubbleUp(this.heap.length - 1); // restore by moving up
  }

  /**
   * deleteMin
   *
   * Removes and returns the minimum-frequency node (the root at index 0).
   * To avoid leaving a hole, the last element is moved to the root and
   * then "sunk down" until the heap property is restored.
   *
   * @returns the node with the smallest frequency
   * @throws if the heap is empty
   * Time complexity: O(log n)
   */
  deleteMin(): HuffmanNode {
    if (this.heap.length === 0) throw new Error('MinHeap: deleteMin on empty heap');

    const min = this.heap[0]; // the minimum is always at the root

    // Move the last element to the root and shrink the heap
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;      // place last at root (may violate heap property)
      this.sinkDown(0);          // restore by moving down
    }

    return min;
  }

  /**
   * size
   *
   * Returns the current number of nodes in the heap.
   *
   * @returns node count
   * Time complexity: O(1)
   */
  size(): number {
    return this.heap.length;
  }

  /**
   * buildHeap
   *
   * Constructs a valid heap from an arbitrary array of nodes in O(n) time
   * (better than inserting one-by-one which is O(n log n)).
   *
   * The trick: only the first n/2 nodes can be parents, so we call sinkDown
   * on each of them from the middle of the array to the root. Leaves are
   * trivially valid already.
   *
   * @param nodes - array of HuffmanNode objects (copied, not mutated)
   * Time complexity: O(n)  — provable by the harmonic series argument
   */
  buildHeap(nodes: HuffmanNode[]): void {
    this.heap = [...nodes]; // shallow copy — we own this array

    // Start at the last non-leaf (parent of the last element) and work up to root
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.sinkDown(i);
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * bubbleUp
   *
   * Moves the node at index `i` upward until the heap property holds.
   * Called after insert to restore order bottom-up.
   *
   * @param i - index of the node to bubble up
   * Time complexity: O(log n)
   */
  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);

      // If the parent is larger, swap — the child belongs higher
      if (this.heap[parent].freq > this.heap[i].freq) {
        [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
        i = parent; // continue checking from the parent position
      } else {
        break; // heap property satisfied — stop
      }
    }
  }

  /**
   * sinkDown
   *
   * Moves the node at index `i` downward until the heap property holds.
   * Called after deleteMin (root replaced by last element) and during buildHeap.
   *
   * At each step, the node is swapped with whichever child has the smaller
   * frequency (if either child is smaller than the node itself).
   *
   * @param i - index of the node to sink down
   * Time complexity: O(log n)
   */
  private sinkDown(i: number): void {
    const n = this.heap.length;

    while (true) {
      let smallest = i;           // assume current node is the smallest
      const left  = 2 * i + 1;   // left child index
      const right = 2 * i + 2;   // right child index

      // Check if left child exists and is smaller than current smallest
      if (left < n && this.heap[left].freq < this.heap[smallest].freq) {
        smallest = left;
      }
      // Check if right child exists and is smaller than current smallest
      if (right < n && this.heap[right].freq < this.heap[smallest].freq) {
        smallest = right;
      }

      if (smallest !== i) {
        // Swap with the smallest child and continue sinking from that position
        [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
        i = smallest;
      } else {
        break; // heap property satisfied — stop
      }
    }
  }
}
