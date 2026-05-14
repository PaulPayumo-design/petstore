const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
})

export function formatPeso(value: number): string {
  return pesoFormatter.format(value)
}

export function formatOptionalPeso(value: number | null | undefined): string | null {
  if (value == null || value <= 0) {
    return null
  }
  return formatPeso(value)
}