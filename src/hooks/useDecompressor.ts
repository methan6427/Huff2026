// React hook to handle decompression in the app.
import { useState, useCallback } from 'react';
import { decompress } from '../algorithms/decompress';
import type { DecompressorState } from '../types/HuffmanTypes';

// Manage decompression state and provide a function to decompress a file.
export function useDecompressor() {
  const [state, setState] = useState<DecompressorState>({ status: 'idle' });

  // Decompress a .huff file when the user picks one.
  const run = useCallback((file: File) => {
    setState({ status: 'processing' });

    // Read the .huff file from the user's computer.
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        const result = decompress(data);
        // Save the file bytes for the header display.
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

  // Reset to start a new decompression.
  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, run, reset };
}
