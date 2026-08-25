import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Admin/Librarian only per backend role middleware.
 */
export function getAllReservations() {
  return apiClient.get(ENDPOINTS.reservations.list);
}

export function getReservationById(id) {
  return apiClient.get(ENDPOINTS.reservations.byId(id));
}

/** Student-only per backend role middleware — scoped to the caller's own reservations. */
export function getMyReservations() {
  return apiClient.get(ENDPOINTS.reservations.mine);
}

/** Student-only per backend role middleware. */
export function createReservation(payload) {
  return apiClient.post(ENDPOINTS.reservations.create, payload);
}

export function updateReservation(id, payload) {
  return apiClient.put(ENDPOINTS.reservations.byId(id), payload);
}

export function deleteReservation(id) {
  return apiClient.delete(ENDPOINTS.reservations.byId(id));
}
