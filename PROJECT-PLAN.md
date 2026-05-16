# Huffman Coding — Project 2 Briefing for Claude Code
**Course:** Design and Analysis of Algorithms (COM336) — Birzeit University  
**Due:** 19 May 2026  
**Stack:** React + Vite + TypeScript  

---

## CRITICAL RULES — READ BEFORE TOUCHING ANY FILE

1. **Comments are mandatory everywhere.** Every file, every function, every non-trivial line must have a comment. Missing comments = mark deduction. Comment the *why*, not just the *what*. If a function does something the instructor specifically explained (e.g. the stack rebuild, PostOrder traversal), say so explicitly in the comment.

2. **Follow the frontend-design skill** located at `/mnt/skills/public/frontend-design/SKILL.md`. Read it before writing a single component. The UI must be visually distinctive, production-grade, and memorable — not generic. No Inter font, no purple gradients on white, no cookie-cutter layouts. Pick a bold aesthetic direction and commit to it fully.

3. **No results displayed outside the UI.** No `console.log` for results, no alerts. Everything shown to the user must go through the React component tree.

4. **The algorithm steps must follow the lecture exactly** — the instructor has explicitly stated that projects not following the lecture steps will not be graded. Do not invent your own tree serialization format or header layout.

5. **Every algorithm file needs dense comments** — the instructor will ask questions during the discussion. Comments make it clear you understood what you wrote.

---

## Project Overview

Build a file compression/decompression desktop web app using the Huffman coding algorithm.

The app must:
- Read **any** file (not just text) as raw bytes
- Compress it into a `.huff` file
- Decompress the `.huff` file back to the original file
- The decompressed file **must be byte-for-byte identical** to the original
- Display a table of Huffman codes for each byte
- Display statistics: original size, compressed size, compression ratio
- Display the header contents visibly in the UI
- Have a clean two-tab UI: **Compress** and **Decompress**
- Have a **simplified secondary interface** that integrates with the file explorer (right-click → compress/decompress)

---

## Folder Structure

```
src/
├── algorithms/
│   ├── HuffmanNode.ts        # Tree node type
│   ├── MinHeap.ts            # Priority queue (min-heap)
│   ├── BitWriter.ts          # Writes bits to a byte buffer
│   ├── BitReader.ts          # Reads bits from a byte buffer
│   ├── compress.ts           # Full compress pipeline
│   └── decompress.ts         # Full decompress pipeline
├── components/
│   ├── CompressTab.tsx       # Compress UI tab
│   ├── DecompressTab.tsx     # Decompress UI tab
│   ├── StatsPanel.tsx        # Shows size before/after + ratio
│   ├── EncodingTable.tsx     # Table of char → Huffman code
│   ├── HeaderDisplay.tsx     # Visualises the .huff header
│   └── FilePicker.tsx        # Reusable file input component
├── hooks/
│   ├── useCompressor.ts      # Wraps compress pipeline for React
│   └── useDecompressor.ts    # Wraps decompress pipeline for React
├── types/
│   └── HuffmanTypes.ts       # Shared TypeScript interfaces
├── App.tsx                   # Root with Compress/Decompress tabs
└── main.tsx                  # Vite entry point
```

---

## Data Structures

### `HuffmanNode`

```ts
interface HuffmanNode {
  char: number | null;   // byte value (0–255), null for internal nodes
  freq: number;          // frequency count
  left: HuffmanNode | null;
  right: HuffmanNode | null;
}
```

### `MinHeap`

A classic min-heap (priority queue) ordered by `freq`. Must implement:
- `insert(node: HuffmanNode): void`
- `deleteMin(): HuffmanNode`
- `size(): number`
- `buildHeap(nodes: HuffmanNode[]): void` — O(n) build from array

The heap is used to build the Huffman tree. **Comment every method with its time complexity.**

### `BitWriter`

Writes individual bits into a growing `Uint8Array`. Packs 8 bits per byte, left to right.

```ts
class BitWriter {
  writeBit(bit: 0 | 1): void
  writeByte(byte: number): void   // writes 8 bits
  writeBits(value: number, count: number): void
  toUint8Array(): Uint8Array
}
```

### `BitReader`

Reads individual bits from a `Uint8Array`. Mirrors `BitWriter` exactly.

```ts
class BitReader {
  readBit(): 0 | 1
  readByte(): number              // reads 8 bits, returns 0–255
  readBits(count: number): number
  hasMore(): boolean
}
```

---

## Algorithm — Compress

### Step 1: Count byte frequencies

```
Read the entire file as Uint8Array.
For each byte value ch (0–255):
  freq[ch]++
```

This is exactly what the instructor wrote on the board:
```
while not eof(file):
  ch = readByte()
  freq[ch] = freq[ch] + 1
```

Only include bytes that actually appear in the file (freq > 0) as leaf nodes.

### Step 2: Build the Huffman tree

This is the algorithm from the whiteboard (must match exactly):

```
n = number of unique bytes (leaves)
Build_Heap(H) from all leaf nodes     // O(n log n)

for i = 1 to n-1 do:
  Z = newNode()
  A = DeleteMin(H)                    // log n
  B = DeleteMin(H)                    // log n
  Z.freq  = A.freq + B.freq
  Z.left  = A
  Z.right = B
  Insert(H, Z)                        // log n
endfor

T(n) = O(n log n)
```

The root of the tree is the single remaining node in the heap.

### Step 3: Generate the encoding table

Traverse the tree **recursively** (PostOrder or any traversal):
- Going left → append `0` to the current code
- Going right → append `1` to the current code
- At a leaf → store `codeTable[node.char] = currentCode`

**Comment note for discussion:** This traversal uses recursion. Recursion is internally implemented using the call stack. If asked "how does recursion work?" — the answer is: it uses a stack (the call stack). The decompression step makes this explicit by using a *manual* stack.

### Step 4: Serialize the Huffman tree

Traverse the tree in **PostOrder (Left → Right → Root)** using recursion.

Rules (instructor-exact):
- If a node is a **leaf** (has a char): write `1` bit, then write the byte value as 8 bits (ASCII/binary)
- If a node is an **internal node** (no char): write `0` bit

```
function serializePostOrder(node, bitWriter):
  if node is null: return
  serializePostOrder(node.left, bitWriter)
  serializePostOrder(node.right, bitWriter)
  if node is leaf:
    bitWriter.writeBit(1)
    bitWriter.writeByte(node.char)
  else:
    bitWriter.writeBit(0)
```

### Step 5: Write the `.huff` file

The header layout is **exact and must not be changed**. The instructor explicitly stated this is what he checks:

```
┌─────────────────────────────────────────────────────────┐
│  HEADER                                                 │
│                                                         │
│  [1]  8 bits  — length of file extension (e.g. 3=TXT)  │
│  [2]  8 bits per char — extension characters (ASCII)   │
│         e.g. TXT = T(8bits) X(8bits) T(8bits)          │
│  [3]  32 bits — length of the serialized Huffman tree  │
│         (4 bytes because tree can be large)             │
│  [4]  N bits  — the serialized Huffman tree             │
│         (PostOrder: leaf=1+8bits, internal=0)           │
│                                                         │
│  DATA                                                   │
│  [5]  remaining bits — encoded file content             │
└─────────────────────────────────────────────────────────┘
```

Write the full buffer to a `.huff` file using the browser's File System API or a Blob download.

---

## Algorithm — Decompress

### Step 1: Read the header

Using `BitReader`, read in this exact order:
1. Read 8 bits → `extensionLength` (number of extension characters)
2. Read `extensionLength × 8` bits → reconstruct the extension string
3. Read 32 bits → `treeLength` (number of bits the serialized tree occupies)
4. Read `treeLength` bits → the serialized tree data

### Step 2: Rebuild the Huffman tree using an explicit Stack

This is the **most important algorithm** for the discussion. The instructor specifically explained this and will ask about it. Use a manual `Stack<HuffmanNode>`, not recursion, for this step.

```
stack = new Stack<HuffmanNode>()

while treeData has more bits:
  bit = readBit()

  if bit === 1:
    // leaf node — read the character
    charByte = readByte()   // 8 bits
    leaf = new HuffmanNode(char=charByte, freq=0)
    stack.push(leaf)

  if bit === 0:
    // internal node — pop two children and merge
    right = stack.pop()     // first pop = right child (LIFO)
    left  = stack.pop()     // second pop = left child
    internalNode = new HuffmanNode(
      char  = null,
      freq  = 0,
      left  = left,
      right = right
    )
    stack.push(internalNode)

// When done, stack has exactly one node = the root
root = stack.pop()
```

**Why Stack? Because it is LIFO (Last In First Out).** The PostOrder serialization writes left subtree first, then right, then root marker. Reading back with a stack naturally reverses this: the first `pop` gives the most recently pushed node (= right child), the second `pop` gives the left child. This is exactly how the instructor explained it.

### Step 3: Decode the bit stream

Starting from the root, walk the tree bit by bit:
- `0` → go left
- `1` → go right
- When a leaf is reached → output `node.char` as a byte, return to root

Repeat until all encoded data bits are consumed.

### Step 4: Write the decoded file

Collect all decoded bytes into a `Uint8Array` and write to a file using the original extension recovered from the header.

---

## UI Requirements

### Main application interface

Two tabs: **Compress** and **Decompress**.

**Compress tab must show:**
- File picker (accepts any file)
- After processing:
  - Encoding table: each byte value → its Huffman code (binary string)
  - Stats panel: original size (bytes), compressed size (bytes), compression ratio (%)
  - Header display: shows the header fields in a readable format
  - Download button for the `.huff` file

**Decompress tab must show:**
- File picker (accepts `.huff` files only)
- After processing:
  - Header display: extension, tree size, decoded tree structure
  - Stats panel: compressed size vs decoded size
  - Download button for the decoded file

### Simplified interface (file explorer integration)

The instructor requires a **second simplified interface** for compressing/decompressing via the file explorer.

Options (choose one based on setup):
- **Electron:** Register a context menu handler. Right-click a file → "Compress with Huffman" or "Decompress". Calls the same algorithm functions.
- **Tauri:** Same approach via Tauri's shell/context menu API.
- **Fallback (acceptable):** A minimal drag-and-drop page at `/mini` route that accepts a dropped file and immediately compresses or decompresses it based on the extension, then auto-downloads the result with no extra clicks.

---

## Commenting Standards

Every file must follow these commenting rules:

### File-level comment (top of every `.ts` / `.tsx` file)
```ts
/**
 * [FileName].ts
 *
 * [One sentence describing what this file does]
 * [One sentence describing why it exists / what problem it solves]
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */
```

### Function-level comment (every exported function/class method)
```ts
/**
 * [functionName]
 *
 * [What it does]
 * [Algorithm reference if applicable — e.g. "Implements the PostOrder
 *  tree serialization as described in the COM336 lecture"]
 *
 * @param paramName - description
 * @returns description
 * Time complexity: O(...)
 */
```

### Inline comments (every non-trivial line or block)
```ts
// Pop right child first because stack is LIFO —
// PostOrder wrote left first, so left was pushed first,
// meaning right is on top of the stack
const right = stack.pop();
const left  = stack.pop();
```

**Specific blocks that MUST have comments:**
- The MinHeap `insert` and `deleteMin` methods (explain heap property)
- The Huffman tree build loop (reference the whiteboard algorithm)
- The PostOrder serialization function (explain leaf=1 / internal=0 rule)
- The stack-based tree rebuild (explain LIFO and why right is popped first)
- The BitWriter `writeBit` packing logic (explain the bit shifting)
- The BitReader `readBit` unpacking logic (explain the bit shifting)
- The header write sequence (label each field: ext length, ext chars, tree length, tree data)
- The header read sequence (mirror the write sequence labels)

---

## What the Instructor Will Ask (Discussion Prep)

| Question | Answer to give |
|---|---|
| What do you store in the header? | Extension length (8 bits) + extension chars (8 bits each) + tree length (32 bits) + serialized Huffman tree (PostOrder) |
| How did you store the tree? | PostOrder traversal — Left → Right → Root. Leaf = 1 bit + 8-bit char. Internal node = 0 bit. |
| How did you implement that traversal? | Recursion — recursive function calls left subtree, then right subtree, then writes the node |
| How does recursion work? | Recursion is built on the call stack internally. We also use an explicit manual stack for the decompression step to rebuild the tree |
| Why a stack for decompression? | Because it is LIFO. PostOrder writes left first, so left is pushed first. Popping gives right first, then left — which is correct for reconstructing the parent node |
| What is the time complexity? | O(n log n) — building the heap is O(n), each of the n-1 merge steps does 2 DeleteMin + 1 Insert = 3 × O(log n) |

---

## Technical Notes

- Work with `Uint8Array` throughout — the file is treated as raw bytes, not text. This ensures any file type (image, PDF, binary) compresses correctly.
- The BitWriter/BitReader must be **bit-exact mirrors** of each other. A bug in either one corrupts the entire output.
- Pad the final byte of encoded data with `0` bits if it doesn't fill a complete byte. The decoder will stop when it outputs the correct number of bytes (track original file size in the header or stop at known byte count — choose one approach and comment it).
- Use `FileReader` API in the browser to read uploaded files as `ArrayBuffer`, then wrap in `Uint8Array`.
- Use `URL.createObjectURL(new Blob([uint8Array]))` to provide file downloads.
- For the encoding table display, sort by char code (0–255) and only show bytes that appear in the file.

---

## Frontend Design Direction

**Read `/mnt/skills/public/frontend-design/SKILL.md` before writing any component.**

Key requirements from that skill:
- Choose a **bold, specific aesthetic direction** — not generic. This is a compression tool, so think: technical precision, data density, monospaced type, terminal-like, or the opposite — ultra-clean editorial. Pick one and execute it fully.
- Use **distinctive fonts** — not Inter, not Roboto, not system-ui. Consider `JetBrains Mono` or `IBM Plex Mono` for data/code areas, paired with something characterful for headings.
- Use **CSS custom properties** for the entire color system.
- Add **meaningful motion** — a progress indicator during compression, a smooth reveal of the stats panel, a subtle animation on the encoding table rows loading in.
- The encoding table and stats panel are the "money shots" — they need to look impressive. This is what the instructor sees.
- No cookie-cutter card-based dashboards. Make spatial decisions that feel intentional.