export interface TreeNode {
  id: string
  children?: TreeNode[]
}

export function traverseAndUpdate<T extends TreeNode>(
  nodes: T[],
  targetId: string,
  updateFn: (node: T) => T
): T[] {
  return nodes.map(node => {
    if (node.id === targetId) {
      return updateFn(node)
    }
    if (node.children) {
      return { ...node, children: traverseAndUpdate(node.children as T[], targetId, updateFn) }
    }
    return node
  })
}

export function findNodeById<T extends TreeNode>(
  nodes: T[],
  targetId: string
): T | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node
    }
    if (node.children) {
      const found = findNodeById(node.children as T[], targetId)
      if (found) return found
    }
  }
  return null
}

export function removeNodeById<T extends TreeNode>(
  nodes: T[],
  targetId: string
): T[] {
  return nodes.filter(node => {
    if (node.id === targetId) {
      return false
    }
    if (node.children) {
      node.children = removeNodeById(node.children as T[], targetId)
    }
    return true
  })
}

export function addNodeToParent<T extends TreeNode>(
  nodes: T[],
  parentId: string,
  newNode: T
): T[] {
  return traverseAndUpdate(nodes, parentId, (parent) => ({
    ...parent,
    children: [...(parent.children || []), newNode]
  }))
}