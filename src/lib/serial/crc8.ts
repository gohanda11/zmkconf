// CRC-8/MAXIM: width=8, poly=0x31, init=0x00, refIn=true, refOut=true, xorOut=0x00
const CRC8_TABLE = (() => {
  const table = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x01) ? ((crc >>> 1) ^ 0x8C) : (crc >>> 1);
    }
    table[i] = crc;
  }
  return table;
})();

export function crc8(data: Uint8Array): number {
  let crc = 0x00;
  for (const byte of data) {
    crc = CRC8_TABLE[crc ^ byte];
  }
  return crc;
}
