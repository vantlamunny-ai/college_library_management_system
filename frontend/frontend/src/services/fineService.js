import apiClient from '../api/client'
import { ENDPOINTS } from '../api/endpoints'


function extractArray(response) {
  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data
  }

  if (Array.isArray(response?.fines)) {
    return response.fines
  }

  if (Array.isArray(response?.data?.fines)) {
    return response.data.fines
  }

  return []
}


/**
 * Admin/Librarian only per backend role middleware.
 */
export async function getAllFines() {
  const response = await apiClient.get(
    ENDPOINTS.fines.list
  )

  return extractArray(response)
}


/**
 * Student-only per backend role middleware.
 * Scoped to the caller's own fines.
 */
export async function getMyFines() {
  const response = await apiClient.get(
    ENDPOINTS.fines.mine
  )

  return extractArray(response)
}


export function createFine(payload) {
  return apiClient.post(
    ENDPOINTS.fines.create,
    payload
  )
}


/**
 * Student-only per backend role middleware.
 */
export function payFine(fineId) {
  return apiClient.put(
    ENDPOINTS.fines.pay(fineId)
  )
}