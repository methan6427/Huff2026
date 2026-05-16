/**
 * useDecompressor.ts
 *
 * React hook that wraps the decompression pipeline for use in components.
 * Mirrors useCompressor in structure: idle → processing → done | error.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { useState, useCallback } from 'react';
import { decompress } from '../algorithms/decompress';
import type { DecompressorState } from '../types/HuffmanTypes';

/**
 * useDecompressor
 *
 * Returns the current decompression state plus a `run` callback.
 * Reading the .huff file uses the browser FileReader API (ArrayBuffer mode).
 *
 * @returns { state, run, reset }
 */
export function useDecompressor() {
  const [state, setState] = useState<DecompressorState>({ status: 'idle' });

  /**
   * run
   *
   * Reads the .huff File as an ArrayBuffer and calls the decompression algorithm.
   *
   * @param file - a .huff File from the file picker
   */
  const run = useCallback((file: File) => {
    setState({ status: 'processing' });

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        const result = decompress(data);
        // Store the raw input bytes so RawHeaderViewer can display the actual header
        setState({ status: 'done', result, rawHuffBuffer: data });
      } catch (err) {
        setState({ status: 'error', error: String(err) });
      }
    };

    reader.onerror = () => {
      setState({ status: 'error', error: 'Failed to read .huff file.' });
    };

    reader.readAsArrayBuffer(file);
  }, []);

  /**
   * reset
   *
   * Returns the hook to the 'idle' state.
   */
  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, run, reset };
}
