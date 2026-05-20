/**
 * useCompressor.ts
 *
 * React hook that wraps the compression pipeline for use in components.
 * Manages async state (idle → processing → done | error) and exposes
 * a `run` function that accepts a File object from the browser's FileReader API.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { useState, useCallback } from 'react';
import { compress } from '../algorithms/compress';
import type { CompressorState } from '../types/HuffmanTypes';

/**
 * useCompressor
 *
 * Returns the current compression state plus a `run` callback.
 * Reading the file uses the browser's FileReader API (ArrayBuffer mode)
 * so the UI thread is not blocked by large files.
 *
 * Usage:
 *   const { state, run, reset } = useCompressor();
 *   run(file);  // triggers compression
 *
 * @returns { state, run, reset }
 */
export function useCompressor() {
  const [state, setState] = useState<CompressorState>({ status: 'idle' });

  /**
   * run
   *
   * Reads the File as an ArrayBuffer, wraps it in Uint8Array, and calls the
   * compression algorithm. Updates state to 'processing' before starting,
   * then 'done' on success or 'error' on failure.
   *
   * @param file - the File object from an <input type="file"> or drag-and-drop event
   */
  const run = useCallback((file: File) => {
    if (file.name.toLowerCase().endsWith('.huff')) {
      setState({ status: 'error', error: 'This file is already a .huff file. Huffman compression cannot be applied again.' });
      return;
    }

    setState({ status: 'processing' });

    // Use FileReader to read the file as a binary ArrayBuffer
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        const result = compress(data, file.name);

        // Count byte frequencies so the UI can sort the encoding table by frequency
        // and compute the weighted average code length. compress() does this internally
        // but does not expose the freq array, so we compute it again here (O(n), cheap).
        const freqTable = new Map<number, number>();
        for (const byte of data) {
          freqTable.set(byte, (freqTable.get(byte) ?? 0) + 1);
        }

        setState({ status: 'done', result: { ...result, freqTable } });
      } catch (err) {
        setState({ status: 'error', error: String(err) });
      }
    };

    reader.onerror = () => {
      setState({ status: 'error', error: 'Failed to read file.' });
    };

    reader.readAsArrayBuffer(file);
  }, []);

  /**
   * reset
   *
   * Returns the hook to the 'idle' state, clearing any previous result or error.
   */
  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, run, reset };
}
