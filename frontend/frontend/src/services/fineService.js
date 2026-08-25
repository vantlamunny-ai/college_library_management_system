import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

/** Admin/Librarian only per backend role middleware. */
export function getAllFines() {
  return apiClient.get(ENDPOINTS.fines.list);
}

/** Student-only per backend role middleware — scoped to the caller's own fines. */
export function getMyFines() {
  return apiClient.get(ENDPOINTS.fines.mine);
}

export function createFine(payload) {
  return apiClient.post(ENDPOINTS.fines.create, payload);
}

/** Student-only per backend role middleware. */
export function payFine(fineId) {
  return apiClient.put(ENDPOINTS.fines.pay(fineId));
}
