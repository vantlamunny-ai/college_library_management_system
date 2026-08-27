import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export function getAllStudents() {
  return apiClient.get(ENDPOINTS.students.list);
}

export function getStudentById(id) {
  return apiClient.get(ENDPOINTS.students.byId(id));
}

/**
 * Resolves the logged-in student's own record (Student role only). Callers
 * should still handle 404 — an account created before self-signup linked
 * roll numbers, or a non-student account, won't have a students row yet.
 */
export function getMyStudentProfile() {
  return apiClient.get(ENDPOINTS.students.me);
}

export function createStudent(studentData) {
  return apiClient.post(ENDPOINTS.students.list, studentData);
}

export function updateStudent(id, studentData) {
  return apiClient.put(ENDPOINTS.students.byId(id), studentData);
}

/** @param {number} id @param {'Active'|'Inactive'|'Blocked'} status */
export function updateAccountStatus(id, status) {
  return apiClient.put(ENDPOINTS.students.accountStatus(id), { status });
}

/** Student-only. @param {{bio?:string, interests?:string, profile_picture?:string}} payload */
export function updateMyProfile(payload) {
  return apiClient.put(ENDPOINTS.students.meProfile, payload);
}

/** Student-only — rate-limited to 7 changes per rolling year (enforced server-side). */
export function changeMyUsername(username) {
  return apiClient.put(ENDPOINTS.students.meUsername, { username });
}

/** Student-only — year/semester/branch, rate-limited to 2 changes per rolling year (enforced server-side). */
export function updateMyAcademicInfo(payload) {
  return apiClient.put(ENDPOINTS.students.meAcademic, payload);
}

export function deleteStudent(id) {
  return apiClient.delete(ENDPOINTS.students.byId(id));
}

/**
 * Student-only self-delete. Fails with a clear message (not a raw error) if
 * the student has active issues/pending fines, or has borrowing history on
 * record that a hard delete can't remove — those need an admin's help.
 */
export function deleteMyAccount() {
  return apiClient.delete(ENDPOINTS.students.me);
}
