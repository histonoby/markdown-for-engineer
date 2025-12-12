const fs = require('fs');
const path = require('path');

// Create a simple 32x32 PNG icon (minimal valid PNG)
// This is a green square icon
const width = 32;
const height = 32;

// PNG file structure
function createPNG() {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);   // width
  ihdrData.writeUInt32BE(height, 4);  // height
  ihdrData.writeUInt8(8, 8);          // bit depth
  ihdrData.writeUInt8(2, 9);          // color type (RGB)
  ihdrData.writeUInt8(0, 10);         // compression
  ihdrData.writeUInt8(0, 11);         // filter
  ihdrData.writeUInt8(0, 12);         // interlace
  
  const ihdr = createChunk('IHDR', ihdrData);
  
  // IDAT chunk (image data)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // Create a gradient green icon
      const centerX = width / 2;
      const centerY = height / 2;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
      const intensity = 1 - (dist / maxDist) * 0.5;
      
      rawData.push(Math.floor(0 * intensity));      // R
      rawData.push(Math.floor(255 * intensity));    // G  
      rawData.push(Math.floor(159 * intensity));    // B (cyber-green)
    }
  }
  
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idat = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create ICO file from PNG
function createICO(pngBuffer) {
  // ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);      // reserved
  header.writeUInt16LE(1, 2);      // type (1 = ICO)
  header.writeUInt16LE(1, 4);      // image count
  
  // ICO directory entry
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);         // width
  entry.writeUInt8(32, 1);         // height
  entry.writeUInt8(0, 2);          // color palette
  entry.writeUInt8(0, 3);          // reserved
  entry.writeUInt16LE(1, 4);       // color planes
  entry.writeUInt16LE(32, 6);      // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8);  // image size
  entry.writeUInt32LE(22, 12);     // image offset (6 + 16)
  
  return Buffer.concat([header, entry, pngBuffer]);
}

// Generate files
const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const png = createPNG();
const ico = createICO(png);

fs.writeFileSync(path.join(iconsDir, 'icon.png'), png);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), ico);
fs.writeFileSync(path.join(iconsDir, '32x32.png'), png);
fs.writeFileSync(path.join(iconsDir, '128x128.png'), png);
fs.writeFileSync(path.join(iconsDir, '128x128@2x.png'), png);
fs.writeFileSync(path.join(iconsDir, 'icon.icns'), ico); // macOS (using ico as placeholder)

console.log('Icons generated successfully!');

