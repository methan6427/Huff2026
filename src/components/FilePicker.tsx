/**
 * FilePicker.tsx
 *
 * Reusable file-input component with drag-and-drop support.
 * Displays the selected file name and size once a file is chosen.
 * Used by both CompressTab (any file) and DecompressTab (.huff only).
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

import { useRef, useState, useCallback } from 'react';

interface FilePickerProps {
  onFile: (file: File) => void;   // callback when a file is selected
  accept?: string;                 // e.g. ".huff" or undefined for any file
  label?: string;                  // instruction text shown in the drop zone
  disabled?: boolean;
}

/**
 * FilePicker
 *
 * Renders a clickable drag-and-drop zone.
 * Clicking opens the native file browser; dragging a file over and releasing
 * triggers the same onFile callback.
 *
 * @param onFile   - called with the selected/dropped File object
 * @param accept   - MIME or extension filter for the native dialog
 * @param label    - descriptive text shown inside the drop zone
 * @param disabled - when true the zone is non-interactive
 */
export function FilePicker({ onFile, accept, label, disabled = false }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Format bytes to a human-readable string (e.g. "1.4 MB")
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
    onFile(file);
  }, [onFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="file-picker-wrapper">
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Visual drop zone */}
      <div
        className={`file-picker-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        aria-label={label ?? 'Drop file or click to browse'}
      >
        {/* Upload icon */}
        <div className="file-picker-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 11l-4-4-4 4M12 7v9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <p className="file-picker-label">
          {isDragging ? 'RELEASE TO LOAD' : (label ?? 'DROP FILE / CLICK TO BROWSE')}
        </p>

        {accept && (
          <p className="file-picker-accept">
            {accept.toUpperCase()} files only
          </p>
        )}
      </div>

      {/* Selected file info */}
      {selectedFile && (
        <div className="file-picker-info">
          <span className="file-picker-name">{selectedFile.name}</span>
          <span className="file-picker-size">{formatSize(selectedFile.size)}</span>
        </div>
      )}
    </div>
  );
}
