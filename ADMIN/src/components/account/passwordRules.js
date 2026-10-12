// Admin password rules, the same checks the server runs (BACKEND/utils/credentials.js
// assertAdminPasswordStrength). The 32-character cap is enforced by PasswordField's maxLength.
export const ADMIN_PASSWORD_RULES = [
  { id: 'length', label: '12–32 characters', test: (p) => p.length >= 12 && p.length <= 32, message: 'Admin passwords must be at least 12 characters.' },
  { id: 'case', label: 'Upper & lowercase letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p), message: 'Use both upper- and lowercase letters.' },
  { id: 'number', label: 'A number', test: (p) => /\d/.test(p), message: 'Include at least one number.' },
  { id: 'symbol', label: 'A symbol', test: (p) => /[^A-Za-z0-9]/.test(p), message: 'Include at least one symbol.' },
];

// First unmet rule's message, or '' when the password is acceptable.
export function validateAdminPassword(password) {
  return ADMIN_PASSWORD_RULES.find((r) => !r.test(password))?.message ?? '';
}

// 0–4: how many rules are met (drives the strength meter).
export const passwordScore = (password) => (password ? ADMIN_PASSWORD_RULES.filter((r) => r.test(password)).length : 0);
