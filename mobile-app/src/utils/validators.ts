export const isValidPhone = (v: string): boolean => {
  return /^\+?[\d\s\-()]{8,20}$/.test((v || '').trim());
};

export const isValidEmail = (v: string): boolean => {
  if (!v) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
};

export type RegistrationForm = {
  fullName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
};

export const validateRegistration = (data: RegistrationForm) => {
  const errors: Partial<Record<keyof RegistrationForm, string>> = {};
  if (!data.fullName?.trim()) errors.fullName = 'registration.nameRequired';
  if (!data.phoneNumber?.trim()) errors.phoneNumber = 'registration.phoneRequired';
  else if (!isValidPhone(data.phoneNumber)) errors.phoneNumber = 'registration.validPhone';
  if (data.email && !isValidEmail(data.email)) errors.email = 'registration.validEmail';
  return errors;
};
