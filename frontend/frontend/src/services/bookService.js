import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export function getAllBooks() {
  return apiClient.get(ENDPOINTS.books.list);
}

export function getBookById(id) {
  return apiClient.get(ENDPOINTS.books.byId(id));
}

/** @param {object} bookData */
export function createBook(bookData) {
  return apiClient.post(ENDPOINTS.books.list, bookData);
}

export function updateBook(id, bookData) {
  return apiClient.put(ENDPOINTS.books.byId(id), bookData);
}

export function deleteBook(id) {
  return apiClient.delete(ENDPOINTS.books.byId(id));
}

// Digital Books Endpoints (Safe 404 handling)
export async function getDigitalBookByBookId(id) {
  try {
    const endpoint = ENDPOINTS.digitalBooks?.byBookId 
      ? ENDPOINTS.digitalBooks.byBookId(id) 
      : `/digital-books/book/${id}`;
    return await apiClient.get(endpoint);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

export function uploadDigitalBook(formData) {
  const endpoint = ENDPOINTS.digitalBooks?.upload || '/digital-books/upload';
  return apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}