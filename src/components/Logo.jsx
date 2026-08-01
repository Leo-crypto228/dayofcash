// Janero mark — the supplied artwork, cropped to a transparent square.
// `light` inverts the black mark to white for use on dark backgrounds.
export default function Logo({ size = 26, light = false, className, style }) {
  return (
    <img
      src="/janero-mark.png"
      alt=""
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      style={{
        display: 'block',
        objectFit: 'contain',
        filter: light ? 'invert(1)' : undefined,
        ...style,
      }}
    />
  )
}
