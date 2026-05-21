// Read bits from a byte array one bit at a time.
export class BitReader {
  private readonly data: Uint8Array;
  private bytePos: number = 0; // Which byte we are reading.
  private bitPos: number  = 0; // Which bit in the byte (0 = leftmost, 7 = rightmost).

  // Start with the byte buffer.
  constructor(data: Uint8Array) {
    this.data = data;
  }

  // Read one bit (0 or 1) and move to the next bit.
  readBit(): 0 | 1 {
    if (!this.hasMore()) throw new Error('BitReader: no more bits to read');

    const byte = this.data[this.bytePos];
    const bit = (byte >> (7 - this.bitPos)) & 1; // Get the bit.

    // Move to next bit.
    this.bitPos++;
    if (this.bitPos === 8) {
      this.bitPos = 0;
      this.bytePos++; // Move to the next byte.
    }

    return bit as 0 | 1;
  }

  // Read 8 bits and make one byte.
  readByte(): number {
    let value = 0;
    for (let i = 0; i < 8; i++) {
      value = (value << 1) | this.readBit(); // Add each bit.
    }
    return value;
  }

  // Read a certain number of bits and make a number.
  readBits(count: number): number {
    let value = 0;
    for (let i = 0; i < count; i++) {
      value = (value << 1) | this.readBit(); // Add each bit.
    }
    return value;
  }

  // Read 4 bytes as one big number.
  readUint32(): number {
    const b3 = this.readByte(); // First byte (biggest).
    const b2 = this.readByte();
    const b1 = this.readByte();
    const b0 = this.readByte(); // Last byte (smallest).

    return (b3 * 0x1000000) + (b2 << 16) + (b1 << 8) + b0;
  }

  // Check if there are more bits to read.
  hasMore(): boolean {
    return this.bytePos < this.data.length;
  }
}
