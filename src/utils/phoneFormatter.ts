// utils/phoneFormatter.ts

/**
 * Formata número de telefone no padrão brasileiro
 * Exemplo: 84999999999 -> (84) 99999-9999
 */
export const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const limitedNumbers = numbers.slice(0, 11);
  
  if (limitedNumbers.length <= 2) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 6) {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
  } else if (limitedNumbers.length <= 10) {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
  } else {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7, 11)}`;
  }
};

/**
 * Remove caracteres não numéricos do código do país
 */
export const cleanCountryCode = (code: string): string => {
  return code.replace(/\D/g, '');
};

/**
 * Valida se o telefone é válido
 */
export const isValidPhone = (phone: string, countryCode: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  const cleanCode = cleanCountryCode(countryCode);
  return cleanPhone.length >= 10 && cleanCode.length >= 2;
};