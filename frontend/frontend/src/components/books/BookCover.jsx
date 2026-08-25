import { useState } from 'react'

/**
 * Renders a real cover image on top of the existing gradient+icon
 * placeholder (never replacing it) — so a missing or broken cover just
 * quietly leaves the placeholder visible instead of showing a blank box,
 * a spinner, or breaking layout. Handles: loading (image is invisible
 * until decoded), missing src (no image attempted at all), and broken
 * images (onError permanently suppresses the <img>).
 */
export function BookCover({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false)
  const [broken, setBroken] = useState(false)

  if (!src || broken) return null

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onLoad={() => setLoaded(true)}
      onError={() => setBroken(true)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
    />
  )
}
