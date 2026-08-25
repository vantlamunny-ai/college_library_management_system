import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export function getAllReturns() {
  return apiClient.get(ENDPOINTS.returns.list);
}

export function getReturnById(id) {
  return apiClient.get(ENDPOINTS.returns.byId(id));
}

/** @param {{issue_id:number, return_date:string, condition_status:string, remarks?:string, processed_by:number}} payload */
export function createReturn(payload) {
  return apiClient.post(ENDPOINTS.returns.create, payload);
}

export function updateReturn(id, payload) {
  return apiClient.put(ENDPOINTS.returns.byId(id), payload);
}

export function deleteReturn(id) {
  return apiClient.delete(ENDPOINTS.returns.byId(id));
}
