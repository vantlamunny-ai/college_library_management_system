import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../../assets/nri-logo-white.png'
import { useAuth } from '../../context/AuthContext'
import { useApi, useMutation } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import * as bookService from '../../services/bookService'
import * as issueService from '../../services/issueService'
import * as reservationService from '../../services/reservationService'
import { BookFormModal } from '../../components/books/BookFormModal'
import { BookCover } from '../../components/books/BookCover'
import { ThemeSwitcher } from '../../components/common/ThemeSwitcher'
import './LibraryCatalog.css'

function availabilityState(book) {
  const available = book.available_copies ?? 0
  if (available === 0) return { label: 'Out of stock', cls: 'lcg-chip-danger' }
  if (available <= 1) return { label: 'Low stock', cls: 'lcg-chip-warning' }
  return { label: 'Available', cls: 'lcg-chip-success' }
}

const TONE_COUNT = 6
function toneFor(id) {
  return ((id - 1) % TONE_COUNT) + 1
}

function BookCard({ book, selected, onSelect }) {
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, mx: 50, my: 50 })
  const [hovering, setHovering] = useState(false)

  const handleMouseMove = (e) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({
      x: py * -16,
      y: px * 18,
      mx: ((e.clientX - rect.left) / rect.width) * 100,
      my: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }
  const handleMouseLeave = () => {
    setHovering(false)
    setTilt({ x: 0, y: 0, mx: 50, my: 50 })
  }
  const state = availabilityState(book)
  const tone = toneFor(book.book_id)

  return (
    <button
      ref={cardRef}
      className={`lcg-book-card tone-${tone} ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(book)}
      onMouseEnter={() => setHovering(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovering ? 1.08 : 1})`,
        '--spot-x': `${tilt.mx}%`,
        '--spot-y': `${tilt.my}%`,
      }}
    >
      {hovering && <span className="lcg-book-spotlight" />}
      <div className="lcg-book-cover">
        <BookCover src={book.cover_image} alt={book.title} />
        <span className="lcg-book-cover-shine" />
        <i className="ti ti-book-2 lcg-book-cover-icon" />
        <div className="lcg-book-hover-glass">
          <div className="lcg-book-hover-title">{book.title}</div>
          <div className="lcg-book-hover-author">{book.category_name || 'Uncategorized'}</div>
          <div className="lcg-hover-row">
            <span className={`lcg-chip ${state.cls}`}>{state.label}</span>
          </div>
        </div>
      </div>
      <div className="lcg-book-meta">
        <div className="lcg-book-meta-title">{book.title}</div>
        <div className="lcg-book-meta-author">{book.category_name || 'Uncategorized'}</div>
      </div>
    </button>
  )
}

export default function LibraryCatalog() {
  const { role, studentProfileStatus, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const ROLE_HOME = { Student: '/student/dashboard', Admin: '/admin/dashboard', Librarian: '/librarian/dashboard' }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const gridRef = useRef(null)

  const isStaff = role === 'Admin' || role === 'Librarian'

  const { data: books, loading, error, refetch } = useApi(() => bookService.getAllBooks(), [])
  const { data: overdueIssues } = useApi(() => issueService.getOverdueIssues(), [], { enabled: isStaff })
  const { data: reservations } = useApi(() => reservationService.getAllReservations(), [], { enabled: isStaff })

  const list = useMemo(() => books || [], [books])
  const categories = useMemo(() => {
    const set = new Set(list.map((b) => b.category_name).filter(Boolean))
    return ['All', ...Array.from(set)]
  }, [list])

  const filtered = list.filter((b) => {
    const matchesCategory = activeCategory === 'All' || b.category_name === activeCategory
    const q = query.toLowerCase()
    const matchesQuery = !q || b.title.toLowerCase().includes(q) || (b.isbn || '').includes(q)
    return matchesCategory && matchesQuery
  })

  const selected = list.find((b) => b.book_id === selectedId) || filtered[0] || list[0]
  const { data: selectedDetail } = useApi(
    () => bookService.getBookById(selected.book_id),
    [selected?.book_id],
    { enabled: Boolean(selected) }
  )

  const lowStock = list.filter((b) => (b.available_copies ?? 0) === 1).length
  const outOfStock = list.filter((b) => (b.available_copies ?? 0) === 0).length
  const pendingReservations = (reservations || []).filter((r) => r.status === 'Pending').length

  const stats = [
    { label: 'Total titles', value: list.length.toLocaleString('en-IN'), sub: `${list.reduce((s, b) => s + (b.total_copies || 0), 0)} copies catalogued`, icon: 'ti-books' },
    { label: 'Low stock', value: lowStock, sub: 'Titles with 1 copy left', icon: 'ti-alert-triangle' },
    { label: 'Out of stock', value: outOfStock, sub: 'No copies available', icon: 'ti-circle-x' },
    { label: 'Overdue returns', value: isStaff ? (overdueIssues || []).length : '—', sub: 'Past due date', icon: 'ti-clock-exclamation' },
    { label: 'Pending reservations', value: isStaff ? pendingReservations : '—', sub: 'Awaiting approval', icon: 'ti-bookmark' },
  ]

  function handleScroll() {
    const el = gridRef.current
    if (!el) return
    setScrollProgress(Math.min(1, el.scrollTop / 160))
  }

  function selectBook(book) {
    setSelectedId(book.book_id)
    setRecentlyViewed((prev) => [book, ...prev.filter((b) => b.book_id !== book.book_id)].slice(0, 6))
  }

  const [reserveRun, reserveState] = useMutation((payload) => reservationService.createReservation(payload))

  async function handleReserve() {
    if (!selected) return
    if (studentProfileStatus !== 'ready') {
      toast.error('Your account has no linked student profile yet — ask an admin to add one from Student Management.')
      return
    }
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 7)
    try {
      await reserveRun({
        book_id: selected.book_id,
        expiry_date: expiry.toISOString().slice(0, 10),
      })
      toast.success(`Reserved "${selected.title}" — held until ${expiry.toLocaleDateString('en-IN')}.`)
    } catch (err) {
      toast.error(err?.message || 'Could not create reservation.')
    }
  }

  return (
    <div className="lcg">
      <a href="#lcg-main-content" className="clms-skip-link">Skip to main content</a>
      {mobileOpen && <div className="lcg-sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`lcg-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <button className="lcg-sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <i className="ti ti-x" />
        </button>
        <div className="lcg-brand"><img src={logo} alt="NRI" /></div>
        <nav className="lcg-nav">
          <a className="lcg-nav-item" onClick={() => navigate(ROLE_HOME[role] || '/student/dashboard')}><i className="ti ti-layout-grid" />Dashboard</a>
          <a className="lcg-nav-item active"><i className="ti ti-books" />Books</a>
          {isStaff && <a className="lcg-nav-item" onClick={() => navigate('/students')}><i className="ti ti-users" />Students</a>}
          {isStaff && <a className="lcg-nav-item" onClick={() => navigate('/circulation')}><i className="ti ti-transfer" />Circulation</a>}
          <a className="lcg-nav-item" onClick={() => navigate('/reservations')}><i className="ti ti-bookmark" />Reservations</a>
          <a className="lcg-nav-item" onClick={() => navigate('/fines')}><i className="ti ti-receipt" />Fines</a>
          {isStaff && <a className="lcg-nav-item" onClick={() => navigate('/reports')}><i className="ti ti-chart-bar" />Reports</a>}
        </nav>
        <ThemeSwitcher itemClassName="lcg-nav-item" />
        <a className="lcg-nav-item logout" onClick={handleLogout}><i className="ti ti-logout" />Logout</a>
      </aside>

      <main className="lcg-main" id="lcg-main-content" tabIndex={-1}>
        <header className="lcg-header">
          <button className="lcg-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu" style={{ marginBottom: 8 }}>
            <i className="ti ti-menu-2" />
          </button>
          <div>
            <h1>Library catalog</h1>
            <p>Browse, track and manage every title in the collection.</p>
          </div>
          {isStaff && (
            <button className="lcg-btn-primary" onClick={() => setAddOpen(true)}>
              <i className="ti ti-plus" /> Add new book
            </button>
          )}
        </header>

        <section className="lcg-stat-strip">
          {stats.map((s) => (
            <div className="lcg-glass-tile" key={s.label}>
              <div className="lcg-glass-tile-icon"><i className={`ti ${s.icon}`} /></div>
              <div>
                <div className="lcg-glass-tile-value">{s.value}</div>
                <div className="lcg-glass-tile-label">{s.label}</div>
                <div className="lcg-glass-tile-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="lcg-body">
          <div className="lcg-list">
            <div className="lcg-glass-toolbar">
              <div className="lcg-search-box">
                <i className="ti ti-search" />
                <input placeholder="Search title or ISBN..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="lcg-chip-filters">
                {categories.map((c) => (
                  <button key={c} className={`lcg-chip-filter ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="lcg-grid-wrap">
              {loading ? (
                <div className="lcg-grid">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="lcg-skeleton" />)}
                </div>
              ) : error ? (
                <div className="lcg-empty-panel">
                  <i className="ti ti-alert-triangle" />
                  <p>Could not load the catalog. <button className="clms-panel-link" onClick={refetch}>Try again</button></p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="lcg-empty-panel">
                  <i className="ti ti-books" />
                  <p>No books match your search.</p>
                </div>
              ) : (
                <>
                  <div className="lcg-grid" ref={gridRef} onScroll={handleScroll}>
                    {filtered.map((book) => (
                      <BookCard key={book.book_id} book={book} selected={selected?.book_id === book.book_id} onSelect={selectBook} />
                    ))}
                  </div>
                  <div className="lcg-scroll-fade" style={{ opacity: 1 - scrollProgress, pointerEvents: scrollProgress > 0.85 ? 'none' : 'auto' }}>
                    <div className="lcg-scroll-hint">
                      <i className="ti ti-chevron-down" />
                      <span>Scroll to explore more books</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {recentlyViewed.length > 0 && (
              <div className="lcg-recent-strip">
                <div className="lcg-recent-label"><i className="ti ti-history" /> Recently viewed</div>
                <div className="lcg-recent-items">
                  {recentlyViewed.map((b) => (
                    <button key={b.book_id} className={`lcg-recent-chip tone-${toneFor(b.book_id)}`} onClick={() => selectBook(b)}>
                      <i className="ti ti-book-2" />
                      <span>{b.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selected && (
            <aside className="lcg-detail">
              <div className={`lcg-detail-cover tone-${toneFor(selected.book_id)}`}>
                <BookCover src={selected.cover_image} alt={selected.title} />
                <i className="ti ti-book-2" />
              </div>
              <h2>{selected.title}</h2>
              <p className="lcg-detail-author">
                {selectedDetail?.authors?.length ? selectedDetail.authors.map((a) => a.author_name).join(', ') : (selected.category_name || 'Uncategorized')}
              </p>

              <div className="lcg-detail-row"><span>ISBN</span><span className="lcg-mono">{selected.isbn}</span></div>
              <div className="lcg-detail-row"><span>Category</span><span>{selected.category_name || '—'}</span></div>
              <div className="lcg-detail-row"><span>Publisher</span><span>{selected.publisher_name || '—'}</span></div>
              <div className="lcg-detail-row"><span>Total copies</span><span>{selected.total_copies ?? 0}</span></div>
              <div className="lcg-detail-row">
                <span>Available</span>
                <span className={(selected.available_copies ?? 0) === 0 ? 'lcg-text-danger' : 'lcg-text-success'}>{selected.available_copies ?? 0}</span>
              </div>

              <button className="clms-btn clms-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => navigate(`/books/${selected.book_id}`)}>
                <i className="ti ti-info-circle" /> Full details &amp; copies
              </button>

              {isStaff && (
                <button
                  className="lcg-btn-primary lcg-detail-cta"
                  disabled={(selected.available_copies ?? 0) === 0}
                  onClick={() => navigate(`/circulation?bookId=${selected.book_id}`)}
                >
                  <i className="ti ti-transfer" /> Issue this book
                </button>
              )}

              {role === 'Student' && (
                <button
                  className="lcg-btn-ghost-light lcg-detail-cta"
                  disabled={reserveState.loading}
                  onClick={handleReserve}
                >
                  {reserveState.loading ? <span className="clms-spinner" /> : <i className="ti ti-bookmark" />} Reserve this book
                </button>
              )}
            </aside>
          )}
        </section>
      </main>

      {isStaff && <BookFormModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={refetch} />}
    </div>
  )
}
