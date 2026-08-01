// Minimal PNG decode/encode (zlib only), shared by the logo tools.
const fs=require("fs")
const zlib=require("zlib")

// --- CRC32 -----------------------------------------------------------------
const CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()
const crc32 = (buf) => {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

// --- decode ----------------------------------------------------------------
function decodePNG(file) {
  const b = fs.readFileSync(file)
  let pos = 8, ihdr = null
  const idat = []
  while (pos < b.length) {
    const len = b.readUInt32BE(pos)
    const type = b.toString('ascii', pos + 4, pos + 8)
    const data = b.slice(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0), height: data.readUInt32BE(4),
        depth: data[8], color: data[9], interlace: data[12],
      }
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    pos += 12 + len
  }
  if (ihdr.depth !== 8 || ihdr.interlace !== 0) throw new Error('unsupported PNG variant')
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[ihdr.color]
  if (!ch) throw new Error('unsupported colour type ' + ihdr.color)

  const raw = zlib.inflateSync(Buffer.concat(idat))
  const { width: W, height: H } = ihdr
  const stride = W * ch
  const out = Buffer.alloc(H * stride)
  let p = 0
  for (let y = 0; y < H; y++) {
    const filter = raw[p++]
    const line = raw.slice(p, p + stride); p += stride
    const cur = out.slice(y * stride, (y + 1) * stride)
    const prev = y > 0 ? out.slice((y - 1) * stride, y * stride) : Buffer.alloc(stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0
      const bb = prev[i]
      const c = i >= ch ? prev[i - ch] : 0
      let v = line[i]
      if (filter === 1) v += a
      else if (filter === 2) v += bb
      else if (filter === 3) v += (a + bb) >> 1
      else if (filter === 4) {
        const pa = Math.abs(bb - c), pb = Math.abs(a - c), pc = Math.abs(a + bb - 2 * c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? bb : c
      }
      cur[i] = v & 0xff
    }
  }
  return { W, H, ch, px: out }
}

// --- encode (RGBA, filter 0) -----------------------------------------------
function encodePNG(W, H, rgba) {
  const raw = Buffer.alloc(H * (1 + W * 4))
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 4)] = 0
    rgba.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4)
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}


module.exports={decodePNG,encodePNG}
