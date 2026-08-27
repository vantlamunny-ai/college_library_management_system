import apiClient from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

/**
 * Student-only per backend role middleware (notificationRoutes.js).
 */

export async function getMyNotifications() {
  const response = await apiClient.get(ENDPOINTS.notifications.mine)

  // Backend response is already an array
  if (Array.isArray(response)) {
    return response
  }

  // Axios-style response: { data: [...] }
  if (Array.isArray(response?.data)) {
    return response.data
  }

  // Backend response: { success: true, data: [...] }
  if (Array.isArray(response?.data?.data)) {
    return response.data.data
  }

  // Backend response: { notifications: [...] }
  if (Array.isArray(response?.notifications)) {
    return response.notifications
  }

  // Backend response: { data: { notifications: [...] } }
  if (Array.isArray(response?.data?.notifications)) {
    return response.data.notifications
  }

  // No notifications / unexpected response
  return []
}

export function markNotificationRead(id) {
  return apiClient.put(
    ENDPOINTS.notifications.markRead(id)
  )
}

export function markAllNotificationsRead() {
  return apiClient.put(
    ENDPOINTS.notifications.markAllRead
  )
}