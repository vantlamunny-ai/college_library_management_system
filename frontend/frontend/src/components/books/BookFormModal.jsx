import { useState } from 'react'
import { Modal } from '../common/Modal'
import { useMutation } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import * as bookService from '../../services/bookService'
import { CATEGORIES } from '../../constants/categories'

function emptyForm(book) {
  if (!book) {
    return { isbn: '', title: '', category_id: CATEGORIES[0].id, edition: '', publication_year: '', language: 'English', pages: '', price: '', description: '' }
  }
  return {
    isbn: book.isbn || '',
    title: book.title || '',
    category_id: book.category_id || CATEGORIES[0].id,
    edition: book.edition || '',
    publication_year: book.publication_year || '',
    language: book.language || 'English',
    pages: book.pages || '',
    price: book.price || '',
    description: book.description || '',
  }
}

/** Shared create/edit form — used by the Catalog's "Add new book" and Book Details' "Edit book". */
export function BookFormModal({ open, book, onClose, onSaved }) {
  const toast = useToast()
  const isEdit = Boolean(book)
  const [form, setForm] = useState(() => emptyForm(book))
  const [key, setKey] = useState(book?.book_id || 'new')
  if ((book?.book_id || 'new') !== key) {
    setKey(book?.book_id || 'new')
    setForm(emptyForm(book))
  }

  const [createRun, createState] = useMutation((payload) => bookService.createBook(payload))
  const [updateRun, updateState] = useMutation(({ id, payload }) => bookService.updateBook(id, payload))
  const loading = createState.loading || updateState.loading

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.isbn || !form.title) {
      toast.error('ISBN and title are required.')
      return
    }
    const payload = {
      ...form,
      category_id: Number(form.category_id),
      publication_year: form.publication_year ? Number(form.publication_year) : undefined,
      pages: form.pages ? Number(form.pages) : undefined,
      price: form.price ? Number(form.price) : undefined,
    }
    try {
      if (isEdit) {
        await updateRun({ id: book.book_id, payload })
        toast.success('Book updated.')
      } else {
        await createRun(payload)
        toast.success(`"${form.title}" added to the catalog.`)
        setForm(emptyForm(null))
      }
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err?.message || 'Could not save this book.')
    }
  }

  return (
    <Modal open={open} title={isEdit ? 'Edit book' : 'Add new book'} onClose={onClose} width={560}>
      <form onSubmit={handleSubmit}>
        <div className="clms-field-row">
          <div className="clms-field">
            <label>Title<span className="required">*</span></label>
            <input className="clms-input" value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>
          <div className="clms-field">
            <label>ISBN<span className="required">*</span></label>
            <input className="clms-input" value={form.isbn} onChange={(e) => set('isbn', e.target.value)} required />
          </div>
        </div>
        <div className="clms-field">
          <label>Category<span className="required">*</span></label>
          <select className="clms-select" style={{ width: '100%' }} value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="clms-field-row">
          <div className="clms-field">
            <label>Edition</label>
            <input className="clms-input" value={form.edition} onChange={(e) => set('edition', e.target.value)} />
          </div>
          <div className="clms-field">
            <label>Publication year</label>
            <input className="clms-input" type="number" value={form.publication_year} onChange={(e) => set('publication_year', e.target.value)} />
          </div>
        </div>
        <div className="clms-field-row">
          <div className="clms-field">
            <label>Language</label>
            <input className="clms-input" value={form.language} onChange={(e) => set('language', e.target.value)} />
          </div>
          <div className="clms-field">
            <label>Pages</label>
            <input className="clms-input" type="number" value={form.pages} onChange={(e) => set('pages', e.target.value)} />
          </div>
        </div>
        <div className="clms-field">
          <label>Price (₹)</label>
          <input className="clms-input" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} />
        </div>
        <div className="clms-field">
          <label>Description</label>
          <textarea className="clms-textarea" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        {!isEdit && (
          <p className="clms-hint">Publisher and authors can be linked once those lookups are available; this creates the core book record.</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button type="button" className="clms-btn clms-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="clms-btn clms-btn-primary" disabled={loading}>
            {loading && <span className="clms-spinner" />} {isEdit ? 'Save changes' : 'Add book'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
