// Write bits one by one into a byte buffer.
export class BitWriter {
  private bytes: number[] = [];  // Finished bytes.
  private currentByte: number = 0; // The byte being built.
  private bitCount: number = 0;    // How many bits in the current byte (0-7).
  private totalBits: number = 0;   // Total bits written.

  // Add one bit to the buffer.
  writeBit(bit: 0 | 1): void {
    this.currentByte = (this.currentByte << 1) | bit; // Add the bit.
    this.bitCount++;
    this.totalBits++;

    if (this.bitCount === 8) {
      // This byte is complete - save it and start a new one.
      this.bytes.push(this.currentByte & 0xFF);
      this.currentByte = 0;
      this.bitCount = 0;
    }
  }

  // Write a byte as 8 separate bits.
  writeByte(byte: number): void {
    for (let i = 7; i >= 0; i--) {
      this.writeBit(((byte >> i) & 1) as 0 | 1);
    }
  }

  // Write a certain number of bits from a number.
  writeBits(value: number, count: number): void {
    for (let i = count - 1; i >= 0; i--) {
      this.writeBit(((value >> i) & 1) as 0 | 1);
    }
  }

  // Write a big number (4 bytes) to the buffer.
  writeUint32(value: number): void {
    this.writeByte((value >>> 24) & 0xFF); // First byte (biggest).
    this.writeByte((value >>> 16) & 0xFF);
    this.writeByte((value >>> 8)  & 0xFF);
    this.writeByte( value         & 0xFF); // Last byte (smallest).
  }

  // Return how many bits we have written.
  getBitCount(): number {
    return this.totalBits;
  }

  // Get the final byte buffer with all bits written.
  toUint8Array(): Uint8Array {
    const result = [...this.bytes]; // Copy the bytes.

    if (this.bitCount > 0) {
      // Finish the last byte if it is not full - add zeros to the right.
      result.push((this.currentByte << (8 - this.bitCount)) & 0xFF);
    }

    return new Uint8Array(result);
  }
}
