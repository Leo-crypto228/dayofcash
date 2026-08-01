// Downscale the supplied app icon (keeps the white rounded card) for favicon use.
const { decodePNG, encodePNG } = require('./png.cjs')
const fs = require('fs')

const src = process.argv[2], dst = process.argv[3], target = Number(process.argv[4]) || 512
const { W, H, ch, px } = decodePNG(src)
const scale = Math.max(W, H) / target
const out = Buffer.alloc(target * target * 4)
for (let y = 0; y < target; y++) for (let x = 0; x < target; x++) {
  const sxa = Math.floor(x * scale), sxb = Math.max(sxa + 1, Math.floor((x + 1) * scale))
  const sya = Math.floor(y * scale), syb = Math.max(sya + 1, Math.floor((y + 1) * scale))
  let r = 0, g = 0, b = 0, n = 0
  for (let sy = sya; sy < syb && sy < H; sy++) for (let sx = sxa; sx < sxb && sx < W; sx++) {
    const i = (sy * W + sx) * ch
    r += px[i]; g += px[i + 1] ?? px[i]; b += px[i + 2] ?? px[i]; n++
  }
  const o = (y * target + x) * 4
  out[o] = n ? r / n : 255; out[o + 1] = n ? g / n : 255; out[o + 2] = n ? b / n : 255; out[o + 3] = 255
}
fs.writeFileSync(dst, encodePNG(target, target, out))
console.log(`icon ${W}x${H} -> ${target}x${target} -> ${dst}`)
