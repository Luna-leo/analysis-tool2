import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { FileNode } from '@/types'
import { mockFileTree } from '@/data/mockData'

interface OpenTab extends FileNode {
  source?: 'explorer' | 'database' | 'calculator' | 'settings'
}

interface FileState {
  fileTree: FileNode[]
  openTabs: OpenTab[]
  activeTab: string
  expandedFolders: Set<string>
  renamingNode: string | null
  creatingNodeType: "folder" | "file" | null
  creatingNodeParentId: string | null
  draggedNode: string | null
  dragOverNode: string | null
  dragPosition: "before" | "after" | "inside" | null
  draggedTab: string | null
  dragOverTab: string | null
}

interface FileActions {
  openFile: (file: FileNode, source?: 'explorer' | 'database' | 'calculator' | 'settings') => void
  closeTab: (fileId: string) => void
  setActiveTab: (tabId: string) => void
  toggleFolder: (folderId: string) => void
  reorderTabs: (draggedId: string, targetId: string) => void
  setFileTree: (fileTree: FileNode[]) => void
  renameNode: (nodeId: string, newName: string) => void
  setRenamingNode: (nodeId: string | null) => void
  createNewFolder: (parentId: string | null, name: string) => void
  createNewFile: (parentId: string | null, name: string) => void
  setCreatingNode: (type: "folder" | "file" | null, parentId: string | null) => void
  moveNode: (nodeId: string, targetId: string | null, position: "before" | "after" | "inside") => void
  setDraggedNode: (nodeId: string | null) => void
  setDragOverNode: (nodeId: string | null, position: "before" | "after" | "inside" | null) => void
  setDraggedTab: (tabId: string | null) => void
  setDragOverTab: (tabId: string | null) => void
}

export type FileStore = FileState & FileActions

export const useFileStore = create<FileStore>()(
  devtools(
    (set) => ({
      // Initial State
      fileTree: mockFileTree,
      openTabs: [],
      activeTab: '',
      expandedFolders: new Set(['1']),
      renamingNode: null,
      creatingNodeType: null,
      creatingNodeParentId: null,
      draggedNode: null,
      dragOverNode: null,
      dragPosition: null,
      draggedTab: null,
      dragOverTab: null,

      // Actions
      openFile: (file, source = 'explorer') => set((state) => {
        const exists = state.openTabs.find((tab) => tab.id === file.id)
        if (exists) {
          return { activeTab: file.id }
        }

        const openTab: OpenTab = { ...file, source }
        return {
          openTabs: [...state.openTabs, openTab],
          activeTab: file.id,
        }
      }),

      closeTab: (fileId) => set((state) => {
        const newTabs = state.openTabs.filter((tab) => tab.id !== fileId)
        const newActiveTab = state.activeTab === fileId && newTabs.length > 0
          ? newTabs[newTabs.length - 1].id
          : state.activeTab === fileId
          ? ''
          : state.activeTab

        return {
          openTabs: newTabs,
          activeTab: newActiveTab,
        }
      }),

      setActiveTab: (tabId) => set({ activeTab: tabId }),

      toggleFolder: (folderId) => set((state) => {
        const newExpanded = new Set(state.expandedFolders)
        if (newExpanded.has(folderId)) {
          newExpanded.delete(folderId)
        } else {
          newExpanded.add(folderId)
        }
        return { expandedFolders: newExpanded }
      }),

      reorderTabs: (draggedId, targetId) => set((state) => {
        const draggedIndex = state.openTabs.findIndex((tab) => tab.id === draggedId)
        const targetIndex = state.openTabs.findIndex((tab) => tab.id === targetId)

        if (draggedIndex === -1 || targetIndex === -1) return state

        const newTabs = [...state.openTabs]
        const [draggedTab] = newTabs.splice(draggedIndex, 1)
        newTabs.splice(targetIndex, 0, draggedTab)

        return { openTabs: newTabs }
      }),

      setFileTree: (fileTree) => set({ fileTree }),

      renameNode: (nodeId, newName) => set((state) => {
        const updateNode = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, name: newName }
            }
            if (node.children) {
              return { ...node, children: updateNode(node.children) }
            }
            return node
          })
        }

        const newFileTree = updateNode(state.fileTree)
        
        // Also update open tabs if the renamed node is open
        const newOpenTabs = state.openTabs.map(tab => 
          tab.id === nodeId ? { ...tab, name: newName } : tab
        )

        return { 
          fileTree: newFileTree,
          openTabs: newOpenTabs,
          renamingNode: null
        }
      }),

      setRenamingNode: (nodeId) => set({ renamingNode: nodeId }),

      createNewFolder: (parentId, name) => set((state) => {
        const newFolder: FileNode = {
          id: `folder_${Date.now()}`,
          name,
          type: "folder",
          children: []
        }

        if (!parentId) {
          // Add to root level
          return { fileTree: [...state.fileTree, newFolder] }
        }

        // Add to specific parent folder
        const addToParent = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.id === parentId && node.type === "folder") {
              return {
                ...node,
                children: [...(node.children || []), newFolder]
              }
            }
            if (node.children) {
              return { ...node, children: addToParent(node.children) }
            }
            return node
          })
        }

        // Ensure parent folder is expanded
        const newExpanded = new Set(state.expandedFolders)
        newExpanded.add(parentId)

        return { 
          fileTree: addToParent(state.fileTree),
          expandedFolders: newExpanded
        }
      }),

      createNewFile: (parentId, name) => set((state) => {
        const newFile: FileNode = {
          id: `file_${Date.now()}`,
          name,
          type: "file",
          dataSources: [],
          charts: []
        }

        if (!parentId) {
          // Add to root level
          return { fileTree: [...state.fileTree, newFile] }
        }

        // Add to specific parent folder
        const addToParent = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.id === parentId && node.type === "folder") {
              return {
                ...node,
                children: [...(node.children || []), newFile]
              }
            }
            if (node.children) {
              return { ...node, children: addToParent(node.children) }
            }
            return node
          })
        }

        // Ensure parent folder is expanded
        const newExpanded = new Set(state.expandedFolders)
        newExpanded.add(parentId)

        return { 
          fileTree: addToParent(state.fileTree),
          expandedFolders: newExpanded
        }
      }),

      setCreatingNode: (type: "folder" | "file" | null, parentId: string | null) => set({ 
        creatingNodeType: type, 
        creatingNodeParentId: parentId 
      }),

      moveNode: (nodeId, targetId, position) => set((state) => {
        // Helper to check if the target is a descendant of the source
        const isDescendant = (sourceId: string, searchId: string | null, nodes: FileNode[]): boolean => {
          if (!searchId) return false
          for (const n of nodes) {
            if (n.id === searchId) {
              const findAncestor = (cur: FileNode): boolean => {
                if (cur.id === sourceId) return true
                if (cur.children) return cur.children.some(findAncestor)
                return false
              }
              return findAncestor(n)
            }
            if (n.children && isDescendant(sourceId, searchId, n.children)) return true
          }
          return false
        }

        // Prevent moving a node into its own descendant
        if (targetId && isDescendant(nodeId, targetId, state.fileTree)) {
          return state
        }

        // Remove the node from the tree while capturing it
        let movedNode: FileNode | null = null
        const removeNode = (nodes: FileNode[]): FileNode[] => {
          return nodes.reduce<FileNode[]>((acc, node) => {
            if (node.id === nodeId) {
              movedNode = node
              return acc
            }
            const children = node.children ? removeNode(node.children) : undefined
            acc.push(children ? { ...node, children } : node)
            return acc
          }, [])
        }

        const treeWithoutNode = removeNode(state.fileTree)
        if (!movedNode) return state // Node not found

        // Add the node at the new location
        const addNode = (nodes: FileNode[]): FileNode[] => {
          if (!targetId) {
            return [...nodes, movedNode!]
          }

          return nodes.reduce<FileNode[]>((acc, node) => {
            if (node.id === targetId) {
              if (position === "inside" && node.type === "folder") {
                acc.push({
                  ...node,
                  children: [...(node.children || []), movedNode!]
                })
              } else if (position === "before") {
                acc.push(movedNode!, node)
              } else if (position === "after") {
                acc.push(node, movedNode!)
              } else {
                acc.push(node)
              }
            } else {
              const children = node.children ? addNode(node.children) : undefined
              acc.push(children ? { ...node, children } : node)
            }
            return acc
          }, [])
        }

        const finalTree = addNode(treeWithoutNode)

        const newOpenTabs = state.openTabs.map(tab =>
          tab.id === nodeId ? movedNode! : tab
        )

        return {
          fileTree: finalTree,
          openTabs: newOpenTabs,
          draggedNode: null,
          dragOverNode: null,
          dragPosition: null
        }
      }),

      setDraggedNode: (nodeId) => set({ draggedNode: nodeId }),

      setDragOverNode: (nodeId, position) => set({ 
        dragOverNode: nodeId, 
        dragPosition: position 
      }),

      setDraggedTab: (tabId) => set({ draggedTab: tabId }),
      setDragOverTab: (tabId) => set({ dragOverTab: tabId }),
    }),
    {
      name: 'file-store',
    }
  )
)