import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

/**
 * @param {{email:string, password:string}
 *        |{roll_number:string, password:string}
 *        |{username:string, password:string}} credentials
 */
export function login(credentials) {
  return apiClient.post(ENDPOINTS.auth.login, credentials);
}

/** @param {{username:string,email:string,password:string,roll_number:string,student_name:string,status?:string,department?:string,year?:string,semester?:string,interests?:string}} payload */
export function register(payload) {
  return apiClient.post(ENDPOINTS.auth.register, payload);
}

export function getCurrentUser() {
  return apiClient.get(ENDPOINTS.auth.currentUser);
}

/** Step 1 — requests a reset. Response data is {emailSent, resetLink}: resetLink is only present when no email was actually sent. */
export function forgotPassword(email) {
  return apiClient.post(ENDPOINTS.auth.forgotPassword, { email });
}

/** Step 2 — consumes the token (from the emailed/returned link) to set a new password. */
export function resetPassword(token, password) {
  return apiClient.put(ENDPOINTS.auth.resetPassword(token), { password });
}
