export const ROOT_ID = ''

export function findNode(node, id) {
  if (!node) return null
  if (node.id === id) return node
  for (const child of node.children ?? []) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function getPath(node, id) {
  if (!node) return null
  if (node.id === id) return [node]
  for (const child of node.children ?? []) {
    const rest = getPath(child, id)
    if (rest) return [node, ...rest]
  }
  return null
}

// true kalau `id` berada di dalam subtree `ancestorId`
export function isDescendant(root, ancestorId, id) {
  const path = getPath(root, id)
  return !!path && path.some((n) => n.id === ancestorId)
}
