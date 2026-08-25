import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export function getBookReport() {
  return apiClient.get(ENDPOINTS.reports.books);
}

export function getIssueReport() {
  return apiClient.get(ENDPOINTS.reports.issues);
}

export function getReturnReport() {
  return apiClient.get(ENDPOINTS.reports.returns);
}

export function getStudentReport() {
  return apiClient.get(ENDPOINTS.reports.students);
}

export function getFineReport() {
  return apiClient.get(ENDPOINTS.reports.fines);
}

export function getReservationReport() {
  return apiClient.get(ENDPOINTS.reports.reservations);
}

export function getDashboardReport() {
  return apiClient.get(ENDPOINTS.reports.dashboard);
}

export function getCopyReport() {
  return apiClient.get(ENDPOINTS.reports.copies);
}
