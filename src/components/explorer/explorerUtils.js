export function itemClass(item, selectedId, clipboardId) {
  const selected = selectedId === item.id ? ' selected' : ''
  const clip = clipboardId === item.id ? ' clip' : ''
  return `${selected}${clip}`
}
