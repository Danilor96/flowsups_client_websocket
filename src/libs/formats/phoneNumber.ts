export function formatPhoneNumber(value: string) {
  if (!value) return '';

  const numericValue = value.replace(/\D/g, '').slice(0, 10);

  if (numericValue.length <= 3) {
    return `(${numericValue}`;
  }

  if (numericValue.length <= 6) {
    return `(${numericValue.slice(0, 3)}) ${numericValue.slice(3)}`;
  }

  return `(${numericValue.slice(0, 3)}) ${numericValue.slice(3, 6)}-${numericValue.slice(6)}`;
}
