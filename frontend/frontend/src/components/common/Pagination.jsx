import './common.css';

/** @param {{page:number, pageSize:number, total:number, onPageChange:(p:number)=>void}} props */
export function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  const pages = [];
  const windowSize = 2;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className="clms-pagination">
      <span className="clms-pagination-info">
        Showing {start}–{end} of {total}
      </span>
      <div className="clms-pagination-controls">
        <button className="clms-page-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <i className="ti ti-chevron-left" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="clms-pagination-info">…</span>
          ) : (
            <button
              key={p}
              className={`clms-page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="clms-page-btn"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <i className="ti ti-chevron-right" />
        </button>
      </div>
    </div>
  );
}
