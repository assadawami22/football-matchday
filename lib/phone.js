// Formats and validates Saudi mobile numbers.
// Accepts input like "0547609964", "547609964", "+966547609964", "966547609964"
// and normalizes/display-formats it as "05X XXX XXXX".

export function formatPhoneInput(raw) {
  let digits = (raw || '').replace(/\D/g, '');

  // Normalize country-code variants down to a local 0-prefixed number
  if (digits.startsWith('966')) {
    digits = '0' + digits.slice(3);
  } else if (digits.length === 9 && digits.startsWith('5')) {
    digits = '0' + digits;
  }

  digits = digits.slice(0, 10); // 05XXXXXXXX is 10 digits

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function isValidSaudiPhone(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  const normalized = digits.startsWith('966') ? '0' + digits.slice(3) : digits;
  return /^05\d{8}$/.test(normalized);
}

export function toDigits(raw) {
  return (raw || '').replace(/\D/g, '');
}
