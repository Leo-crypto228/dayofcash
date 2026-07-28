// Universal placeholder avatar: grey circle, head + shoulders silhouette.
// Kept as a data URI so it can be used anywhere an image src is expected.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<circle cx="50" cy="50" r="50" fill="#d7dbe0"/>
<circle cx="50" cy="39" r="15" fill="#9aa3ae"/>
<path d="M20 87c0-17 13-26 30-26s30 9 30 26z" fill="#9aa3ae"/>
</svg>`

export const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(SVG)
