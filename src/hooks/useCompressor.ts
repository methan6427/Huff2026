// React hook to handle compression in the app.
import { useState, useCallback } from 'react';
import { compress } from '../algorithms/compress';
import type { CompressorState } from '../types/HuffmanTypes';

// Manage compression state and provide a function to compress a file.
export function useCompressor() {
  const [state, setState] = useState<CompressorState>({ status: 'idle' });

  // Compress a file when the user picks one.
  const run = useCallback((file: File) => {
    if (file.name.toLowerCase().endsWith('.huff')) {
      setState({ status: 'error', error: 'This file is already a .huff file. Huffman compression cannot be applied again.' });
      return;
    }

    setState({ status: 'processing' });

    // Read the file from the user's computer.
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        const result = compress(data, file.name);

        // Count byte frequencies for the display.
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

  // Reset to start a new compression.
  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, run, reset };
}
