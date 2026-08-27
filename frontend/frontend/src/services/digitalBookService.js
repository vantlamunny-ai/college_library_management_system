import apiClient from '../api/client';

/** Uploads a PDF for a book. Expects a File object and the book_id. */
export function uploadDigitalBook(bookId, file, accessType = 'Students Only') {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('book_id', bookId);
  formData.append('access_type', accessType);

  return apiClient.post('/digital-books/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Fetches all digital book records (each linked to a book_id). */
export function getDigitalBooks() {
  return apiClient.get('/digital-books');
}

export function getDigitalBookById(id) {
  return apiClient.get(`/digital-books/${id}`);
}