import { useMemo, useState } from 'react';
import { SkeletonRows } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Pagination } from './Pagination';
import './common.css';

/**
 * @param {{
 *  columns: {key:string, header:string, render?:(row:any)=>any, sortable?:boolean,
 *            sortValue?:(row:any)=>any, align?:'left'|'right'|'center', mono?:boolean}[],
 *  rows: any[], keyField?: string, loading?: boolean, error?: any, onRetry?: ()=>void,
 *  emptyTitle?: string, emptyMessage?: string, emptyIcon?: string,
 *  pageSize?: number, onRowClick?: (row:any)=>void, renderCard?: (row:any)=>any,
 *  rowActions?: (row:any)=>any
 * }} props
 */
export function DataTable({
  columns,
  rows,
  keyField = 'id',
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No records found',
  emptyMessage = 'Try adjusting your search or filters.',
  emptyIcon = 'ti-inbox',
  pageSize = 10,
  onRowClick,
  renderCard,
  rowActions,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  // Jump back to page 1 whenever the row set changes (new search/filter results) —
  // adjusted during render rather than an effect, per React's recommended pattern.
  const [prevRows, setPrevRows] = useState(rows);
  if (prevRows !== rows) {
    setPrevRows(rows);
    if (page !== 1) setPage(1);
  }

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    const getVal = col?.sortValue || ((r) => r[sortKey]);
    return [...rows].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortDir, columns]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  function toggleSort(col) {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  }

  if (loading) return <SkeletonRows count={6} />;
  if (error) {
    return (
      <ErrorState
        message={error.message || 'Could not load this data. Please try again.'}
        onRetry={onRetry}
      />
    );
  }
  if (!rows || rows.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <>
      <div className={`clms-table-wrap ${renderCard ? 'responsive-cards' : ''}`}>
        <table className="clms-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? 'is-sortable' : ''}
                  style={{ textAlign: col.align || 'left' }}
                  onClick={() => toggleSort(col)}
                >
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <i className={`ti ti-chevron-${sortDir === 'asc' ? 'up' : 'down'}`} style={{ marginLeft: 4 }} />
                  )}
                </th>
              ))}
              {rowActions && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr
                key={row[keyField]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={col.mono ? 'clms-cell-mono' : ''}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {rowActions && (
                  <td className="clms-cell-actions" onClick={(e) => e.stopPropagation()}>
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {renderCard && (
          <div className="clms-row-cards">
            {paged.map((row) => (
              <div key={row[keyField]} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {renderCard(row)}
              </div>
            ))}
          </div>
        )}
      </div>

      <Pagination page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} />
    </>
  );
}
