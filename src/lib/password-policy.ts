export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "111111",
  "000000",
  "qwerty",
  "abc123",
  "iloveyou",
  "welcome",
  "admin",
  "letmein",
  "password",
  "password1",
  "p@ssword",
]);

export interface PasswordPolicyContext {
  password: string;
  email?: string | null;
  name?: string | null;
}

export interface PasswordRuleResult {
  id: "length" | "common" | "personal";
  label: string;
  passed: boolean;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function containsPersonalInfo(password: string, email?: string | null, name?: string | null) {
  const normalizedPassword = normalize(password);

  if (email) {
    const normalizedEmail = normalize(email);
    const emailLocalPart = normalizedEmail.split("@")[0];
    if (
      (emailLocalPart && emailLocalPart.length >= 3 && normalizedPassword.includes(emailLocalPart)) ||
      normalizedPassword.includes(normalizedEmail)
    ) {
      return true;
    }
  }

  if (name) {
    const normalizedName = normalize(name);
    if (normalizedName.length >= 3 && normalizedPassword.includes(normalizedName)) {
      return true;
    }
  }

  return false;
}

export function getPasswordRuleResults(context: PasswordPolicyContext): PasswordRuleResult[] {
  const normalizedPassword = normalize(context.password);

  return [
    {
      id: "length",
      label: `Use ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`,
      passed: context.password.length >= PASSWORD_MIN_LENGTH && context.password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      id: "common",
      label: "Avoid common passwords",
      passed: normalizedPassword.length > 0 && !COMMON_PASSWORDS.has(normalizedPassword),
    },
    {
      id: "personal",
      label: "Do not include your name or email",
      passed: normalizedPassword.length > 0 && !containsPersonalInfo(context.password, context.email, context.name),
    },
  ];
}

export function isPasswordPolicyCompliant(context: PasswordPolicyContext) {
  return getPasswordRuleResults(context).every((rule) => rule.passed);
}
