import React from 'react';

const BookReaderModal = ({ isOpen, onClose, pdfUrl, bookTitle, isbn }) => {
  if (!isOpen) return null;

  const BACKEND_URL = 'http://localhost:3000';
  const cleanIsbn = isbn ? isbn.replace(/[^0-9X]/gi, '') : '';

  // Determine Reader Frame URL
  let finalReaderUrl = '';

  if (pdfUrl) {
    // Priority 1: Local Uploaded PDF
    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
      finalReaderUrl = pdfUrl;
    } else {
      const cleanPath = pdfUrl.replace(/\\/g, '/');
      const formattedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
      finalReaderUrl = `${BACKEND_URL}${formattedPath}`;
    }
  } else if (cleanIsbn) {
    // Priority 2: Google Books Embedded Preview (Clean & No 401 Errors)
    finalReaderUrl = `https://books.google.com/books?vid=ISBN${cleanIsbn}&printsec=frontcover&output=embed`;
  } else {
    // Priority 3: Google Search Fallback Viewer
    finalReaderUrl = `https://www.google.com/search?q=${encodeURIComponent(bookTitle || '')}+filetype:pdf&btnI=1`;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '1100px',
        height: '85vh',
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          backgroundColor: '#020617',
          borderBottom: '1px solid #1e293b',
          color: '#fff'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
            {bookTitle || 'Digital Book'} — Online Reader
          </h3>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Close ✖
          </button>
        </div>

        {/* Reader Body */}
        <div style={{ flex: 1, backgroundColor: '#fff', position: 'relative' }}>
          <iframe
            src={finalReaderUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={bookTitle || 'Online Reader'}
          />
        </div>
      </div>
    </div>
  );
};

export default BookReaderModal;