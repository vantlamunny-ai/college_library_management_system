import React, { useState } from 'react';

// Added named export here (export function BookCover)
export function BookCover({ src, alt, isbn }) {
  const [imgError, setImgError] = useState(false);

  const cleanIsbn = isbn ? isbn.replace(/[^0-9X]/gi, '') : '';
  const googleCover = cleanIsbn 
    ? `https://books.google.com/books/content?vid=ISBN${cleanIsbn}&printsec=frontcover&img=1&zoom=1` 
    : null;

  const imageSrc = src || googleCover;

  return (
    <div className="clms-book-cover-wrap" style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {imageSrc && !imgError ? (
        <img
          src={imageSrc}
          alt={alt || 'Book Cover'}
          onError={() => setImgError(true)}
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