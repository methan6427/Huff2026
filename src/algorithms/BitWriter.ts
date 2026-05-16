/**
 * BitWriter.ts
 *
 * Writes individual bits into a growing byte buffer.
 * Bits are packed left-to-right (MSB first) within each byte.
 * Used to build the .huff file bit by bit during compression.
 *
 * Part of: COM336 Project 2 — Huffman Coding
 */

/**
 * BitWriter
 *
 * Accumulates bits one at a time and packs them into bytes.
 * Every 8 bits written produce one byte in the internal buffer.
 * The final (possibly partial) byte is padded with 0-bits on the right
 * when toUint8Array() is called.
 *
 * Bit packing (MSB first, left-to-right within a byte):
 *   writeBit(1), writeBit(0), writeBit(1), writeBit(1)  →  ...1011xxxx
 *   After 8 bits the byte is flushed and a new one starts.
 */
export class BitWriter {
  private bytes: number[] = [];  // completed full bytes
  private currentByte: number = 0; // byte being assembled (up to 8 bits)
  private bitCount: number = 0;    // how many bits are in currentByte so far (0–7)
  private totalBits: number = 0;   // total bits written (for getBitCount)

  /**
   * writeBit
   *
   * Appends a single bit to the buffer.
   * The bit is placed in the next available MSB-first position of the current byte.
   * When the byte is full (8 bits), it is flushed to `bytes` and a new byte begins.
   *
   * Bit shifting logic:
   *   currentByte = (currentByte << 1) | bit
   *   After each shift the new bit lands in the LSB position;
   *   as more bits arrive the older bits shift further left.
   *   When 8 bits have accumulated the result is a complete byte.
   *
   * @param bit - 0 or 1
   * Time complexity: O(1)
   */
  writeBit(bit: 0 | 1): void {
    // Shift existing bits left by 1 and OR the new bit into the LSB
    this.currentByte = (this.currentByte << 1) | bit;
    this.bitCount++;
    this.totalBits++;

    if (this.bitCount === 8) {
      // Byte is complete — flush it to the array and reset
      this.bytes.push(this.currentByte & 0xFF);
      this.currentByte = 0;
      this.bitCount = 0;
    }
  }

  /**
   * writeByte
   *
   * Writes all 8 bits of a byte value, MSB first (bit 7 first, bit 0 last).
   *
   * @param byte - integer 0–255
   * Time complexity: O(1) (8 fixed iterations)
   */
  writeByte(byte: number): void {
    // Iterate from bit 7 (MSB) down to bit 0 (LSB)
    for (let i = 7; i >= 0; i--) {
      this.writeBit(((byte >> i) & 1) as 0 | 1);
    }
  }

  /**
   * writeBits
   *
   * Writes the `count` least-significant bits of `value`, MSB first.
   * Used for variable-length fields (e.g. Huffman codes from the code table).
   *
   * @param value - the integer whose bits to write
   * @param count - number of bits to write (starting from bit count-1 down to bit 0)
   * Time complexity: O(count)
   */
  writeBits(value: number, count: number): void {
    for (let i = count - 1; i >= 0; i--) {
      this.writeBit(((value >> i) & 1) as 0 | 1);
    }
  }

  /**
   * writeUint32
   *
   * Writes a 32-bit unsigned integer as 4 bytes, most-significant byte first.
   * Uses unsigned right-shift (>>>) so the sign bit is treated as a data bit.
   * Supports values up to 2^32 − 1 (≈ 4 GB file size limit).
   *
   * @param value - unsigned 32-bit integer
   * Time complexity: O(1) (4 bytes = 32 fixed iterations)
   */
  writeUint32(value: number): void {
    // Break into 4 bytes MSB-first using unsigned shift to avoid sign extension
    this.writeByte((value >>> 24) & 0xFF); // most significant byte
    this.writeByte((value >>> 16) & 0xFF);
    this.writeByte((value >>> 8)  & 0xFF);
    this.writeByte( value         & 0xFF); // least significant byte
  }

  /**
   * getBitCount
   *
   * Returns the total number of bits written so far (including the partial byte).
   * Used by compress.ts to record the tree bit-length in the header.
   *
   * @returns total bits written
   * Time complexity: O(1)
   */
  getBitCount(): number {
    return this.totalBits;
  }

  /**
   * toUint8Array
   *
   * Finalises the buffer and returns it as a Uint8Array.
   * If the last byte is partial (fewer than 8 bits), it is padded with 0-bits
   * on the right (LSB side) — the decoder ignores these padding bits because
   * it stops after reading the original file length stored in the header.
   *
   * Non-destructive: the internal state is not modified.
   *
   * @returns the complete byte buffer
   * Time complexity: O(n) where n is the number of bytes
   */
  toUint8Array(): Uint8Array {
    const result = [...this.bytes]; // copy — do not mutate internal state

    if (this.bitCount > 0) {
      // Shift the partial byte left so the written bits are in the high positions,
      // filling the unused low positions with 0s (padding)
      result.push((this.currentByte << (8 - this.bitCount)) & 0xFF);
    }

    return new Uint8Array(result);
  }
}
