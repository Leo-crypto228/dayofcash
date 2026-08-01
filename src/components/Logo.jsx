// Janero mark: a stylised "J" loop whose tapering tail is the trail of a
// plane taking off. Drawn as filled paths so it stays sharp at any size and
// inherits the surrounding text colour.
export default function Logo({ size = 26, className, style }) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M90 30 L90 52 C90 76 72 92 50 92 C28 92 10 76 10 52 C10 38 20 28 32 23 L46 19 C38 28 30 39 30 52 C30 63 39 72 50 72 C61 72 70 63 70 52 L70 30 A10 10 0 0 1 90 30 Z" />
      <g transform="translate(64 15) rotate(45)">
        <path d="M0 -12 C1.6 -12 2.6 -10 2.6 -7.5 L2.6 -3 L13 3.5 L13 6 L2.6 3 L2.6 7.5 L5.5 10.5 L5.5 12 L0 10.5 L-5.5 12 L-5.5 10.5 L-2.6 7.5 L-2.6 3 L-13 6 L-13 3.5 L-2.6 -3 L-2.6 -7.5 C-2.6 -10 -1.6 -12 0 -12 Z" />
      </g>
    </svg>
  )
}
