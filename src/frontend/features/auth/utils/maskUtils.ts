/**
 * Utilitários puros para formatação e sanitização de identificadores fiscais.
 */

export function mascararCnpj(valor: string): string {
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 14);

  if (apenasNumeros.length <= 2) {
    return apenasNumeros;
  }
  if (apenasNumeros.length <= 5) {
    return `${apenasNumeros.slice(0, 2)}.${apenasNumeros.slice(2)}`;
  }
  if (apenasNumeros.length <= 8) {
    return `${apenasNumeros.slice(0, 2)}.${apenasNumeros.slice(2, 5)}.${apenasNumeros.slice(5)}`;
  }
  if (apenasNumeros.length <= 12) {
    return `${apenasNumeros.slice(0, 2)}.${apenasNumeros.slice(2, 5)}.${apenasNumeros.slice(5, 8)}/${apenasNumeros.slice(8)}`;
  }

  return `${apenasNumeros.slice(0, 2)}.${apenasNumeros.slice(2, 5)}.${apenasNumeros.slice(5, 8)}/${apenasNumeros.slice(8, 12)}-${apenasNumeros.slice(12, 14)}`;
}

export function desmascararCnpj(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function isCnpjFormatoValido(valor: string): boolean {
  return desmascararCnpj(valor).length === 14;
}
