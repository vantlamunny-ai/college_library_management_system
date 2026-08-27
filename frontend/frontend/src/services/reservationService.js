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

  if (Array.isArray(response?.reservations)) {
    return response.reservations
  }

  if (Array.isArray(response?.data?.reservations)) {
    return response.data.reservations
  }

  return []
}


/**
 * Admin/Librarian only per backend role middleware.
 */
export async function getAllReservations() {
  const response = await apiClient.get(
    ENDPOINTS.reservations.list
  )

  return extractArray(response)
}


/**
 * Get reservation by ID.
 */
export function getReservationById(id) {
  return apiClient.get(
    ENDPOINTS.reservations.byId(id)
  )
}


/**
 * Student-only per backend role middleware.
 * Scoped to the caller's own reservations.
 */
export async function getMyReservations() {
  const response = await apiClient.get(
    ENDPOINTS.reservations.mine
  )

  return extractArray(response)
}


/**
 * Student-only per backend role middleware.
 */
export function createReservation(payload) {
  return apiClient.post(
    ENDPOINTS.reservations.create,
    payload
  )
}


export function updateReservation(id, payload) {
  return apiClient.put(
    ENDPOINTS.reservations.byId(id),
    payload
  )
}


export function deleteReservation(id) {
  return apiClient.delete(
    ENDPOINTS.reservations.byId(id)
  )
}