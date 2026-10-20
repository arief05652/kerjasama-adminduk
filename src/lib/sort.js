export const SORTS = [
  { value: 'date-desc', label: 'Tanggal terbaru' },
  { value: 'date-asc', label: 'Tanggal terlama' },
  { value: 'name-asc', label: 'Nama (A–Z)' },
  { value: 'name-desc', label: 'Nama (Z–A)' },
  { value: 'size-desc', label: 'Ukuran terbesar' },
  { value: 'size-asc', label: 'Ukuran terkecil' },
]

const collator = new Intl.Collator('id', { sensitivity: 'base' })

// Ambil tanggal dari nama file dengan pola tanggal_bulan_tahun (pemisah _ atau -),
// contoh: "12_10_2026.pdf" atau "12-10-2026.pdf"
export function parseNameDate(name) {
  const match = String(name).match(/(\d{1,2})[_-](\d{1,2})[_-](\d{4})/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return new Date(year, month - 1, day)
}

// Prioritas: tanggal pada nama file, kalau tidak ada baru pakai tanggal diubah
export function effectiveDate(item) {
  return parseNameDate(item.name) ?? new Date(item.modified)
}

export function sortItems(items, sort) {
  const sorted = [...items].sort((a, b) => {
    switch (sort) {
      case 'date-asc':
        return effectiveDate(a) - effectiveDate(b)
      case 'name-asc':
        return collator.compare(a.name, b.name)
      case 'name-desc':
        return collator.compare(b.name, a.name)
      case 'size-desc':
        return (b.size ?? 0) - (a.size ?? 0)
      case 'size-asc':
        return (a.size ?? 0) - (b.size ?? 0)
      case 'date-desc':
      default:
        return effectiveDate(b) - effectiveDate(a)
    }
  })
  // Folder selalu di atas, urutan di dalamnya mengikuti pilihan sortir
  return [
    ...sorted.filter((i) => i.type === 'folder'),
    ...sorted.filter((i) => i.type !== 'folder'),
  ]
}

export function periodKey(item) {
  const d = effectiveDate(item)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function buildPeriodOptions(items) {
  const seen = new Set()
  const options = []
  for (const item of items) {
    const key = periodKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    const [year, month] = key.split('-')
    const label = new Date(Number(year), Number(month) - 1).toLocaleDateString(
      'id-ID',
      { month: 'long', year: 'numeric' },
    )
    options.push({ value: key, label })
  }
  return options.sort((a, b) => b.value.localeCompare(a.value))
}

export function filterByPeriod(items, value) {
  if (!value) return items
  return items.filter((item) => periodKey(item) === value)
}
