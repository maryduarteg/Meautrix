export function normalizeCnpj(value: string) {
  return value.replace(/[.\-/\s]/g, "").toUpperCase()
}

export function formatCnpj(value: string) {
  const cnpj = normalizeCnpj(value).replace(/[^A-Z0-9]/g, "").slice(0, 14)
  return cnpj
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, "$1.$2")
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3")
    .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, ".$1/$2")
    .replace(/([A-Z0-9]{4})([A-Z0-9])/, "$1-$2")
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeCnpj(value)
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) {
    return false
  }

  for (let length = 12; length <= 13; length++) {
    let sum = 0
    let weight = 2
    for (let i = length - 1; i >= 0; i--) {
      sum += (cnpj.charCodeAt(i) - 48) * weight
      weight = weight === 9 ? 2 : weight + 1
    }
    const remainder = sum % 11
    const digit = remainder < 2 ? 0 : 11 - remainder
    if (Number(cnpj[length]) !== digit) return false
  }

  return true
}
