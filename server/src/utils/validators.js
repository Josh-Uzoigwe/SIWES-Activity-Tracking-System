// Input validation utilities for SIWES API

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  return trimmed.length >= 5 && trimmed.length <= 254 && EMAIL_REGEX.test(trimmed);
};

const isValidPassword = (password) => {
  if (typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 128;
};

const isNonEmptyString = (str, minLength = 1, maxLength = 255) => {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

const isValidPositiveInt = (val) => {
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isNonEmptyString,
  isValidPositiveInt,
};
