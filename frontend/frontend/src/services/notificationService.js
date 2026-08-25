import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

/** Student-only per backend role middleware (notificationRoutes.js). */
export function getMyNotifications() {
  return apiClient.get(ENDPOINTS.notifications.mine);
}

export function markNotificationRead(id) {
  return apiClient.put(ENDPOINTS.notifications.markRead(id));
}

export function markAllNotificationsRead() {
  return apiClient.put(ENDPOINTS.notifications.markAllRead);
}
