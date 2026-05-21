#!/usr/bin/env node
/**
 * huff-compress-windows.mjs
 *
 * Windows version of the Huffman compressor CLI.
 * Intended for use via Explorer right-click context menu.
 *
 * Usage:  node huff-compress-windows.mjs <input-file>
 *
 * A PowerShell SaveFileDialog asks where to write the .huff output.
 * Refuses to compress files that already end with .huff.
 */

import { readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { spawnSync } from 'child_process';

// ── Windows UI helpers ───────────────────────────────────────────────────────

function ps(command) {
  return spawnSync('powershell', [
    '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', command,
  ], { encoding: 'utf-8' });
}

function msgBox(text, title, icon = 'Information') {
  const safeText  = text.replace(/'/g, "''");
  const safeTitle = title.replace(/'/g, "''");
  ps(
    `Add-Type -AssemblyName System.Windows.Forms; ` +
    `[System.Windows.Forms.MessageBox]::Show('${safeText}', '${safeTitle}', 'OK', '${icon}') | Out-Null`
  );
}

function saveDialog(defaultPath) {
  const dir  = dirname(defaultPath).replace(/\\/g, '\\\\');
  const name = basename(defaultPath).replace(/'/g, "''");
  const result = ps(
    `Add-Type -AssemblyName System.Windows.Forms; ` +
    `$d = New-Object System.Windows.Forms.SaveFileDialog; ` +
    `$d.Title = 'Save .huff file'; ` +
    `$d.Filter = 'Huffman files (*.huff)|*.huff|All files (*.*)|*.*'; ` +
    `$d.FileName = '${name}'; ` +
    `$d.InitialDirectory = '${dir}'; ` +
    `if ($d.ShowDialog() -eq 'OK') { Write-Output $d.FileName }`
  );
  return result.stdout.trim() || null;
}

// ── HuffmanNode factories ────────────────────────────────────────────────────

function makeLeaf(char, freq) {
  return { char, freq, left: null, right: null };
}

function makeInternal(left, right) {
  return { char: null, freq: left.freq + right.freq, left, right };
}

// ── MinHeap ──────────────────────────────────────────────────────────────────

class MinHeap {
  constructor() { this.heap = []; }

  insert(node) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  deleteMin() {
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  buildHeap(nodes) {
    this.heap = [...nodes];
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this._sinkDown(i);
    }
  }

  _bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.heap[p].freq > this.heap[i].freq) {
        [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
        i = p;
      } else break;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let s = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].freq < this.heap[s].freq) s = l;
      if (r < n && this.heap[r].freq < this.heap[s].freq) s = r;
      if (s !== i) {
        [this.heap[s], this.heap[i]] = [this.heap[i], this.heap[s]];
        i = s;
      } else break;
    }
  }
}

// ── BitWriter ────────────────────────────────────────────────────────────────

class BitWriter {
  constructor() {
    this.bytes     = [];
    this.currentByte = 0;
    this.bitCount  = 0;
    this.totalBits = 0;
  }

  writeBit(bit) {
    this.currentByte = (this.currentByte << 1) | bit;
    this.bitCount++;
    this.totalBits++;
    if (this.bitCount === 8) {
      this.bytes.push(this.currentByte & 0xFF);
      this.currentByte = 0;
      this.bitCount    = 0;
    }
  }

  writeByte(byte) {
    for (let i = 7; i >= 0; i--) this.writeBit((byte >> i) & 1);
  }

  writeUint32(value) {
    this.writeByte((value >>> 24) & 0xFF);
    this.writeByte((value >>> 16) & 0xFF);
    this.writeByte((value >>>  8) & 0xFF);
    this.writeByte( value         & 0xFF);
  }

  getBitCount() { return this.totalBits; }

  toUint8Array() {
    const result = [...this.bytes];
    if (this.bitCount > 0) result.push((this.currentByte << (8 - this.bitCount)) & 0xFF);
    return new Uint8Array(result);
  }
}

// ── Compression pipeline ─────────────────────────────────────────────────────

function countFrequencies(data) {
  const freq = new Array(256).fill(0);
  for (const byte of data) freq[byte]++;
  return freq;
}

function buildTree(freq) {
  const leaves = [];
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) leaves.push(makeLeaf(i, freq[i]));
  }
  if (leaves.length === 0) return null;
  if (leaves.length === 1) return leaves[0];
  const heap = new MinHeap();
  heap.buildHeap(leaves);
  for (let i = 0; i < leaves.length - 1; i++) {
    heap.insert(makeInternal(heap.deleteMin(), heap.deleteMin()));
  }
  return heap.deleteMin();
}

function generateCodes(node, code, table) {
  if (node.char !== null) {
    table.set(node.char, code.length === 0 ? '0' : code);
    return;
  }
  generateCodes(node.left,  code + '0', table);
  generateCodes(node.right, code + '1', table);
}

function serializeTree(node, writer) {
  if (!node) return;
  serializeTree(node.left,  writer);
  serializeTree(node.right, writer);
  if (node.char !== null) { writer.writeBit(1); writer.writeByte(node.char); }
  else writer.writeBit(0);
}

function compress(data, fileName) {
  const dotIndex = fileName.lastIndexOf('.');
  const ext = dotIndex >= 0 ? fileName.slice(dotIndex + 1) : '';

  const freq = countFrequencies(data);
  const root = buildTree(freq);
  const codeTable = new Map();
  if (root) generateCodes(root, '', codeTable);

  const tempWriter = new BitWriter();
  if (root) serializeTree(root, tempWriter);
  const treeBitCount = tempWriter.getBitCount();

  const writer = new BitWriter();
  writer.writeByte(ext.length);
  for (const ch of ext) writer.writeByte(ch.charCodeAt(0));
  writer.writeUint32(data.length);
  writer.writeUint32(treeBitCount);
  if (root) serializeTree(root, writer);
  for (const byte of data) {
    for (const bit of codeTable.get(byte)) writer.writeBit(bit === '1' ? 1 : 0);
  }
  return writer.toUint8Array();
}

// ── Main ─────────────────────────────────────────────────────────────────────

const inputPath = process.argv[2];
if (!inputPath) {
  msgBox('Usage: huff-compress-windows.mjs <file>', 'Huffman Compress', 'Error');
  process.exit(1);
}

// Refuse to compress an already-compressed .huff file
if (inputPath.toLowerCase().endsWith('.huff')) {
  msgBox(
    'This file is already a .huff file.\nHuffman compression cannot be applied again.',
    'Already Compressed',
    'Warning'
  );
  process.exit(0);
}

const data       = new Uint8Array(readFileSync(inputPath));
const fileName   = basename(inputPath);
const defaultOut = join(dirname(inputPath), fileName + '.huff');

const outputPath = saveDialog(defaultOut);
if (!outputPath) process.exit(0); // user cancelled

const compressed = compress(data, fileName);
writeFileSync(outputPath, Buffer.from(compressed));

const ratio    = ((compressed.length / data.length) * 100).toFixed(1);
const savings  = data.length - compressed.length;
const savingsTxt = savings >= 0
  ? `Saved ${savings} bytes (${(100 - parseFloat(ratio)).toFixed(1)}% smaller)`
  : `Expanded by ${-savings} bytes (small or high-entropy file)`;

msgBox(
  `${fileName}  →  ${basename(outputPath)}\n` +
  `${data.length} B  →  ${compressed.length} B  (${ratio}%)\n` +
  savingsTxt,
  'Huffman Compress — Done'
);
