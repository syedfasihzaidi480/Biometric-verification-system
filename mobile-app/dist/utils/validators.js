export const isValidPhone = (v) => {
    return /^\+?[\d\s\-()]{8,20}$/.test((v || '').trim());
};
export const isValidEmail = (v) => {
    if (!v)
        return true; // optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
};
export const validateRegistration = (data) => {
    const errors = {};
    if (!data.fullName?.trim())
        errors.fullName = 'registration.nameRequired';
    if (!data.phoneNumber?.trim())
        errors.phoneNumber = 'registration.phoneRequired';
    else if (!isValidPhone(data.phoneNumber))
        errors.phoneNumber = 'registration.validPhone';
    if (data.email && !isValidEmail(data.email))
        errors.email = 'registration.validEmail';
    return errors;
};
