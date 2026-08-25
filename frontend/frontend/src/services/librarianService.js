import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

/** Admin only. */
export function getAllLibrarians() {
  return apiClient.get(ENDPOINTS.librarians.list);
}

/** Resolves the logged-in librarian's own record (Librarian role only). */
export function getMyLibrarianProfile() {
  return apiClient.get(ENDPOINTS.librarians.me);
}

/**
 * Admin-only account provisioning — creates the login and the librarian
 * record together. The password is set here by the Admin and handed to
 * the new librarian directly; no endpoint ever returns it again.
 */
export function createLibrarian(payload) {
  return apiClient.post(ENDPOINTS.librarians.create, payload);
}
