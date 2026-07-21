/**
 * Password Policy Validator
 *
 * Enforces strong password requirements:
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Minimum 12 characters required');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('At least 1 uppercase letter (A-Z) required');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('At least 1 lowercase letter (a-z) required');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('At least 1 number (0-9) required');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('At least 1 special character (!@#$%^&*(),.?":{}|<>) required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if password is commonly used or weak
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    'password123',
    '12345678',
    'qwerty123',
    'admin123',
    'letmein',
    'welcome',
    'monkey123',
    'dragon123',
    'master123',
  ];

  return commonPasswords.includes(password.toLowerCase());
}

/**
 * Get password strength score (0-5)
 */
export function getPasswordStrength(password: string): number {
  let score = 0;

  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (/[^A-Za-z0-9!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  return Math.min(score, 5);
}

/**
 * Get human-readable password strength label
 */
export function getPasswordStrengthLabel(password: string): string {
  const score = getPasswordStrength(password);

  if (score <= 1) return 'Very Weak';
  if (score <= 2) return 'Weak';
  if (score <= 3) return 'Medium';
  if (score <= 4) return 'Strong';
  return 'Very Strong';
}
