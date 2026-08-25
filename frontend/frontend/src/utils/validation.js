// Mirrors the pattern enforced server-side in services/authService.js —
// used here only to route the typed identifier to the right field, not as
// a security boundary (the backend re-validates everything regardless).
const ROLL_NUMBER_PATTERN = /^[0-9]{2}[A-Z]{2}[0-9][A-Z][A-Z0-9]{4}$/;

export function looksLikeRollNumber(value) {
  return ROLL_NUMBER_PATTERN.test((value || '').trim().toUpperCase());
}

// Mirrors USERNAME_PATTERN in services/authService.js.
const USERNAME_PATTERN = /^[A-Za-z0-9._]+$/;

export function looksLikeUsername(value) {
  return USERNAME_PATTERN.test((value || '').trim());
}
