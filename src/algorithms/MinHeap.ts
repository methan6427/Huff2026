// A priority queue that keeps the smallest frequency on top.
import type { HuffmanNode } from '../types/HuffmanTypes';

// A min-heap data structure - the smallest item is always at position 0.
export class MinHeap {
  // Stores the nodes in a list that keeps the heap property.
  private heap: HuffmanNode[] = [];

  // Add a node and move it up until the heap property is correct.
  insert(node: HuffmanNode): void {
    this.heap.push(node); // Add to the end.
    this.bubbleUp(this.heap.length - 1); // Move up to the right place.
  }

  // Remove and return the smallest node, then fix the heap.
  deleteMin(): HuffmanNode {
    if (this.heap.length === 0) throw new Error('MinHeap: deleteMin on empty heap');

    const min = this.heap[0]; // The smallest is always at the top.

    // Move the last item to the top and fix the heap order.
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0); // Move down to the right place.
    }

    return min;
  }

  // Return how many nodes are in the heap.
  size(): number {
    return this.heap.length;
  }

  // Build a heap quickly from a list of nodes.
  buildHeap(nodes: HuffmanNode[]): void {
    this.heap = [...nodes]; // Copy the list.

    // Fix the heap order starting from the middle and going up.
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.sinkDown(i);
    }
  }

  // Move a node up the tree until it is in the right place.
  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);

      // Swap with parent if the parent is bigger.
      if (this.heap[parent].freq > this.heap[i].freq) {
        [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
        i = parent; // Keep going up.
      } else {
        break; // The node is in the right place now.
      }
    }
  }

  // Move a node down the tree until it is in the right place.
  private sinkDown(i: number): void {
    const n = this.heap.length;

    while (true) {
      let smallest = i;
      const left  = 2 * i + 1;   // Left child position.
      const right = 2 * i + 2;   // Right child position.

      // Find the smaller child and compare to this node.
      if (left < n && this.heap[left].freq < this.heap[smallest].freq) {
        smallest = left;
      }
      if (right < n && this.heap[right].freq < this.heap[smallest].freq) {
        smallest = right;
      }

      if (smallest !== i) {
        // Swap and keep going down.
        [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
        i = smallest;
      } else {
        break; // The node is in the right place now.
      }
    }
  }
}
