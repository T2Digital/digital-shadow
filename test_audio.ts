import fs from 'fs';

const u8 = new Uint8Array(24000 * 2); // 1 second of silence
const dataBytes = u8.length;
const bufferWav = new ArrayBuffer(44 + dataBytes);
const view = new DataView(bufferWav);

const setUint16 = (pos: number, data: number) => view.setUint16(pos, data, true);
const setUint32 = (pos: number, data: number) => view.setUint32(pos, data, true);

setUint32(0, 0x46464952); setUint32(4, 36 + dataBytes); setUint32(8, 0x45564157);
setUint32(12, 0x20746d66); setUint32(16, 16); setUint16(20, 1); setUint16(22, 1);
setUint32(24, 24000); setUint32(28, 24000 * 2); setUint16(32, 2); setUint16(34, 16);
setUint32(36, 0x61746164); setUint32(40, dataBytes);
new Uint8Array(bufferWav, 44).set(u8);

fs.writeFileSync('test.wav', Buffer.from(bufferWav));
