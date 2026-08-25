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
