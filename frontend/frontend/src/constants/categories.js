/**
 * TODO(backend): there's no GET /categories endpoint to look these up
 * dynamically. books.category_id is NOT NULL, so a category must be picked
 * on every book creation — this list mirrors exactly what db/schema.sql
 * seeds. If categories are added/renamed in the database, update this list
 * to match (or better: add a real /categories endpoint and swap this out
 * for a live fetch).
 */
export const CATEGORIES = [
  { id: 1, name: 'Computer Science' },
  { id: 2, name: 'Information Technology' },
  { id: 3, name: 'Database Management' },
  { id: 4, name: 'Artificial Intelligence' },
  { id: 5, name: 'Web Development' },
  { id: 6, name: 'Data Science' },
  { id: 7, name: 'Cyber Security' },
  { id: 8, name: 'Electronics and Communication' },
  { id: 9, name: 'Engineering Mathematics' },
  { id: 10, name: 'General Knowledge' },
]
