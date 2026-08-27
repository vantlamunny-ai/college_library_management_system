import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Panel } from '../../components/common/Panel'
import { StatusBadge } from '../../components/common/StatusBadge'
import { DataTable } from '../../components/common/DataTable'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { ErrorState } from '../../components/common/ErrorState'
import { SkeletonBlock } from '../../components/common/LoadingSkeleton'
import { BookFormModal } from '../../components/books/BookFormModal'
import BookCover from '../../components/books/BookCover'
import BookReaderModal from '../../components/books/BookReaderModal'
import { useApi, useMutation } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import * as bookService from '../../services/bookService'
import * as issueService from '../../services/issueService'
import { formatDate } from '../../utils/date'
import { formatCurrency } from '../../utils/format'
import './BookDetails.css'

export default function BookDetails() {
  const { bookId } = useParams()
  const { role } = useAuth()
  const isStaff = role === 'Admin' || role === 'Librarian'
  const navigate = useNavigate()
  const toast = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isReaderOpen, setIsReaderOpen] = useState(false)

  const { data: book, loading, error, refetch } = useApi(() => bookService.getBookById(bookId), [bookId])
  const { data: activeIssues } = useApi(() => issueService.getActiveIssues(), [], { enabled: isStaff })
  const [deleteRun, deleteState] = useMutation((id) => bookService.deleteBook(id))

  const issuedByCopy = useMemo(() => {
    const map = new Map()
    for (const i of activeIssues || []) map.set(i.copy_id, i)
    return map
  }, [activeIssues])

  async function handleDelete() {
    try {
      await deleteRun(book.book_id)
      toast.success('Book deleted.')
      navigate('/library')
    } catch (err) {
      toast.error(err?.message || 'Could not delete this book.')
      setDeleteOpen(false)
    }
  }

  if (loading) return <SkeletonBlock height={400} />
  if (error) return <ErrorState message="Could not load this book." onRetry={refetch} />
  if (!book) return <ErrorState title="Book not found" message="This title may have been removed." />

  const columns = [
    { key: 'accession_number', header: 'Accession', mono: true },
    { key: 'shelf_location', header: 'Location', render: (r) => r.shelf_location || '—' },
    { key: 'condition_status', header: 'Condition', render: (r) => <StatusBadge status={r.condition_status} /> },
    { key: 'availability_status', header: 'Availability', render: (r) => <StatusBadge status={r.availability_status} /> },
    {
      key: 'borrower', header: 'Current borrower',
      render: (r) => {
        const issue = issuedByCopy.get(r.copy_id)
        if (!issue) return '—'
        return (
          <>
            <div className="clms-cell-title">{issue.student_name}</div>
            <div className="clms-cell-sub">Due {formatDate(issue.due_date)}</div>
          </>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title={book.title}
        subtitle={`${book.category_name || 'Uncategorized'} · ${book.publisher_name || 'Unknown publisher'}`}
        actions={
          <>
            <button 
              className="clms-btn clms-btn-primary" 
              onClick={() => setIsReaderOpen(true)}
              style={{ background: '#22c55e', color: '#fff', border: 'none' }}
            >
              <i className="ti ti-book" /> Read Online
            </button>
            {isStaff && (
              <>
                <button className="clms-btn clms-btn-ghost" onClick={() => setEditOpen(true)}><i className="ti ti-edit" /> Edit book</button>
                {role === 'Admin' && (
                  <button className="clms-btn clms-btn-danger" onClick={() => setDeleteOpen(true)}><i className="ti ti-trash" /> Delete</button>
                )}
              </>
            )}
          </>
        }
      />

      <div className="bd-grid">
        <Panel title="Book information">
          <div className="bd-cover" style={{ textAlign: 'center', marginBottom: 15 }}>
            <BookCover key={bookId} src={book.cover_image} alt={book.title} isbn={book.isbn} />
          </div>

          <button 
            className="clms-btn"
            onClick={() => setIsReaderOpen(true)}
            style={{ width: '100%', marginBottom: 18, background: '#22c55e', color: '#fff', border: 'none', padding: '10px', fontWeight: 'bold' }}
          >
            📖 Read Online (PDF Viewer)
          </button>

          <div className="clms-row-card-fields">
            <div className="clms-row-card-field"><span>Author(s)</span><span>{book.authors?.length ? book.authors.map((a) => a.author_name).join(', ') : '—'}</span></div>
            <div className="clms-row-card-field"><span>ISBN</span><span className="clms-cell-mono">{book.isbn}</span></div>
            <div className="clms-row-card-field"><span>Edition</span><span>{book.edition || '—'}</span></div>
            <div className="clms-row-card-field"><span>Publication year</span><span>{book.publication_year || '—'}</span></div>
            <div className="clms-row-card-field"><span>Language</span><span>{book.language || '—'}</span></div>
            <div className="clms-row-card-field"><span>Pages</span><span>{book.pages || '—'}</span></div>
            <div className="clms-row-card-field"><span>Price</span><span>{book.price ? formatCurrency(book.price) : '—'}</span></div>
          </div>
          {book.description && (
            <>
              <div className="clms-panel-head" style={{ marginTop: 18 }}><h2>Description</h2></div>
              <p style={{ color: 'var(--muted)', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>{book.description}</p>
            </>
          )}
        </Panel>

        <Panel
          title={`Copies (${book.copies?.length || 0})`}
          headerRight={
            isStaff && (
              <button className="clms-panel-link" disabled title="No backend endpoint exists yet to add a copy directly.">
                <i className="ti ti-plus" /> Add copy
              </button>
            )
          }
        >
          <DataTable
            columns={columns}
            rows={book.copies || []}
            keyField="copy_id"
            emptyTitle="No copies on record"
            emptyMessage="This book has no physical copies catalogued yet."
            emptyIcon="ti-books"
            rowActions={isStaff ? () => (
              <span className="clms-badge clms-badge-neutral">
                No direct edit yet
              </span>
            ) : undefined}
          />
        </Panel>
      </div>

      {/* Book Reader Modal Component */}
      <BookReaderModal
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        pdfUrl={book?.digitalBook?.file_path || book?.file_path}
        bookTitle={book?.title}
      />

      {isStaff && <BookFormModal open={editOpen} book={book} onClose={() => setEditOpen(false)} onSaved={refetch} />}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete book"
        message={`Permanently delete "${book.title}" and all its copy records? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteState.loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}