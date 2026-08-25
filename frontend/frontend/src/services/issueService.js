import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export function getAllIssues() {
  return apiClient.get(ENDPOINTS.issues.list);
}

export function getIssueStatistics() {
  return apiClient.get(ENDPOINTS.issues.statistics);
}

export function getActiveIssues() {
  return apiClient.get(ENDPOINTS.issues.active);
}

export function getOverdueIssues() {
  return apiClient.get(ENDPOINTS.issues.overdue);
}

export function getStudentIssues(studentId) {
  return apiClient.get(ENDPOINTS.issues.byStudent(studentId));
}

export function getStudentActiveIssues(studentId) {
  return apiClient.get(ENDPOINTS.issues.activeByStudent(studentId));
}

export function getCopyIssueHistory(copyId) {
  return apiClient.get(ENDPOINTS.issues.byCopy(copyId));
}

export function getIssue(id) {
  return apiClient.get(ENDPOINTS.issues.byId(id));
}

/** @param {{student_id:number, copy_id:number, librarian_id:number, loan_days?:number}} payload */
export function issueBook(payload) {
  return apiClient.post(ENDPOINTS.issues.create, payload);
}

/**
 * TODO(backend): no renew endpoint exists on issueRoutes yet. Wired against
 * the expected shape so it activates the moment the route is added.
 */
export function renewIssue(issueId) {
  return apiClient.put(ENDPOINTS.issues.renew(issueId));
}
