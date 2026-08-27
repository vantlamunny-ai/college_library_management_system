import { useEffect, useRef, useState } from 'react';
import { baseURL } from '../../api/client';

const LOAD_TIMEOUT_MS = 4000;

/**
 * Tries `src` first (usually an openlibrary.org cover, which sometimes
 * routes through a slow/occasionally-blocked archive.org redirect chain),
 * then falls back to a Google Books cover by ISBN if that fails or is too
 * slow, before finally giving up to the plain placeholder icon. Each stage
 * is time-boxed so a stuck request can't leave the tile blank forever.
 *
 * Callers that reuse one BookCover instance across different books (e.g. a
 * detail panel where `selected` changes but the JSX position doesn't) need
 * to pass `key={book.book_id}` so this fallback chain restarts per book —
 * a list rendering one card per book already gets that for free from its
 * own per-item key.
 */
export function BookCover({ src, alt, isbn }) {
  const cleanIsbn = isbn ? isbn.replace(/[^0-9X]/gi, '') : '';
  // Routed through our own backend (not books.google.com directly) — it
  // has no real cover for plenty of ISBNs and returns a valid-looking
  // "image not available" graphic instead of a 404, which a plain <img>
  // tag can't tell apart from a real cover. The proxy checks for that and
  // turns it into an actual 404 so this component's own fallback/error
  // handling works correctly.
  const googleCover = cleanIsbn
    ? `${baseURL}/books/cover/${cleanIsbn}`
    : null;

  const candidates = [src, googleCover].filter(Boolean);

  const [stageIndex, setStageIndex] = useState(0);
  const settledRef = useRef(false);

  const currentSrc = candidates[stageIndex];

  useEffect(() => {
    settledRef.current = false;
    if (!currentSrc) return;
    const timer = setTimeout(() => {
      // Only advance if this attempt never actually loaded/errored —
      // otherwise a slow-but-successful image would get swapped out from
      // under the user right after it finally appeared.
      if (!settledRef.current) setStageIndex((i) => i + 1);
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [currentSrc]);

  return (
    <div className="clms-book-cover-wrap" style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {currentSrc ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={alt || 'Book Cover'}
          onLoad={() => { settledRef.current = true; }}
          onError={() => { settledRef.current = true; setStageIndex((i) => i + 1); }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div className="clms-book-cover-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155', color: '#94a3b8', width: '100%', height: '100%' }}>
          <i className="ti ti-book-2" style={{ fontSize: '2rem' }} />
        </div>
      )}
    </div>
  );
}

// Keeping default export as fallback
export default BookCover;
