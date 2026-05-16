/**
 * BitReader.ts
 *
 * Reads individual bits from a Uint8Array.
 * Mirrors BitWriter exactly — bits are read left-to-right (MSB first)
 * within each byte, matching the order they were written during compression.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

/**
 * BitReader
 *
 * Walks through a byte array one bit at a time.
 * Maintains a byte-position pointer and a bit-position pointer (0 = MSB).
 *
 * Bit extraction (MSB first):
 *   byte = 0b10110000
 *   bitPos 0 → bit 7 → 1   (mask: byte >> 7 & 1)
 *   bitPos 1 → bit 6 → 0   (mask: byte >> 6 & 1)
 *   bitPos 2 → bit 5 → 1   (mask: byte >> 5 & 1)
 *   ...
 *   bitPos 7 → bit 0 → 0   (mask: byte >> 0 & 1)
 */
export class BitReader {
  private readonly data: Uint8Array;
  private bytePos: number = 0; // index of the current byte being read
  private bitPos: number  = 0; // position within the current byte (0 = MSB, 7 = LSB)

  /**
   * @param data - the byte buffer produced by BitWriter.toUint8Array()
   */
  constructor(data: Uint8Array) {
    this.data = data;
  }

  /**
   * readBit
   *
   * Returns the next bit from the stream (0 or 1), advancing the position.
   *
   * Bit extraction logic:
   *   The current byte is stored as an 8-bit value.
   *   Bit at position `bitPos` (0 = MSB) is at physical bit (7 - bitPos).
   *   Mask: (byte >> (7 - bitPos)) & 1
   *
   * @returns 0 or 1
   * @throws if there are no more bits to read
   * Time complexity: O(1)
   */
  readBit(): 0 | 1 {
    if (!this.hasMore()) throw new Error('BitReader: no more bits to read');

    const byte = this.data[this.bytePos];

    // Extract the bit at position bitPos, counting from MSB (left to right)
    const bit = (byte >> (7 - this.bitPos)) & 1;

    // Advance to the next bit position
    this.bitPos++;
    if (this.bitPos === 8) {
      // Current byte is exhausted — move to the next byte
      this.bitPos = 0;
      this.bytePos++;
    }

    return bit as 0 | 1;
  }

  /**
   * readByte
   *
   * Reads 8 consecutive bits and assembles them into a byte value (MSB first).
   * Mirrors BitWriter.writeByte exactly.
   *
   * @returns integer 0–255
   * Time complexity: O(1) (8 fixed iterations)
   */
  readByte(): number {
    let value = 0;
    // Accumulate bits from MSB to LSB
    for (let i = 0; i < 8; i++) {
      value = (value << 1) | this.readBit();
    }
    return value;
  }

  /**
   * readBits
   *
   * Reads `count` consecutive bits and assembles them into an integer (MSB first).
   * Mirrors BitWriter.writeBits exactly.
   *
   * @param count - number of bits to read
   * @returns integer assembled from `count` bits
   * Time complexity: O(count)
   */
  readBits(count: number): number {
    let value = 0;
    for (let i = 0; i < count; i++) {
      value = (value << 1) | this.readBit();
    }
    return value;
  }

  /**
   * readUint32
   *
   * Reads 4 bytes (32 bits) as an unsigned 32-bit integer, MSB first.
   * Uses multiplication for the most-significant byte to avoid signed-integer
   * overflow that would occur with the left-shift operator (which works on
   * signed 32-bit integers in JavaScript).
   *
   * @returns unsigned 32-bit integer (0 to 2^32 − 1)
   * Time complexity: O(1) (32 fixed iterations)
   */
  readUint32(): number {
    const b3 = this.readByte(); // most significant byte
    const b2 = this.readByte();
    const b1 = this.readByte();
    const b0 = this.readByte(); // least significant byte

    // Multiply the MSB by 2^24 (not left-shift) to avoid signed-int issues
    return (b3 * 0x1000000) + (b2 << 16) + (b1 << 8) + b0;
  }

  /**
   * hasMore
   *
   * Returns true if there are more bits available to read.
   * The decoder loop uses `output.length < originalSize` to stop,
   * but hasMore() is used defensively in the tree-rebuild loop.
   *
   * @returns true if the read pointer has not passed the end of the buffer
   * Time complexity: O(1)
   */
  hasMore(): boolean {
    return this.bytePos < this.data.length;
  }
}
