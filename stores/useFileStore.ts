import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { FileNode, ChartComponent, EventInfo, DataSourceStyle } from '@/types'
import { mockFileTree } from '@/data/mockData'
import { useGraphStateStore } from './useGraphStateStore'
import { traverseAndUpdate, findNodeById, addNodeToParent } from '@/utils/treeUtils'
import { ChartOperations } from '@/services/chartOperations'

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
  updateFileCharts: (fileId: string, charts: ChartComponent[]) => void
  updateFileDataSources: (fileId: string, dataSources: EventInfo[]) => void
  updateDataSourceStyle: (fileId: string, dataSourceId: string, style: DataSourceStyle) => void
  duplicateChart: (fileId: string, chartId: string) => void
  deleteChart: (fileId: string, chartId: string) => void
  deleteNode: (nodeId: string) => void
}

export type FileStore = FileState & FileActions

export const useFileStore = create<FileStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      // Initial State
      fileTree: mockFileTree,
      openTabs: [],
      activeTab: '',
      expandedFolders: new Set(),
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
        
        // Check if we have saved chart data for this file
        const graphStateStore = useGraphStateStore.getState()
        const savedState = graphStateStore.getSavedState()
        const savedTab = savedState?.tabs?.find(tab => tab.id === file.id)
        
        // If we have saved charts for this file, use them
        const openTab: OpenTab = { 
          ...file, 
          source,
          charts: savedTab?.charts || file.charts
        }
        
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

      setActiveTab: (tabId) => {
        // Clean up any tooltips when switching tabs
        if (typeof window !== 'undefined') {
          import('@/utils/chartTooltip').then(({ hideAllTooltips }) => {
            hideAllTooltips()
          })
        }
        set({ activeTab: tabId })
      },

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
        const newFileTree = traverseAndUpdate(state.fileTree, nodeId, (node) => ({
          ...node,
          name: newName
        }))
        
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
          return addNodeToParent(nodes, parentId, newFolder)
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
          return addNodeToParent(nodes, parentId, newFile)
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

      updateFileCharts: (fileId, charts) => set((state) => {
        // Update charts in fileTree
        const newFileTree = traverseAndUpdate(state.fileTree, fileId, (node) => ({
          ...node,
          charts
        }))

        // Update charts in openTabs
        const newOpenTabs = state.openTabs.map(tab => 
          tab.id === fileId ? { ...tab, charts } : tab
        )

        return {
          fileTree: newFileTree,
          openTabs: newOpenTabs
        }
      }),

      updateFileDataSources: (fileId, dataSources) => set((state) => {
        // Update dataSources in fileTree
        const newFileTree = traverseAndUpdate(state.fileTree, fileId, (node) => ({
          ...node,
          selectedDataSources: dataSources
        }))

        // Update dataSources in openTabs
        const newOpenTabs = state.openTabs.map(tab => 
          tab.id === fileId ? { ...tab, selectedDataSources: dataSources } : tab
        )

        return {
          fileTree: newFileTree,
          openTabs: newOpenTabs
        }
      }),

      updateDataSourceStyle: (fileId, dataSourceId, style) => set((state) => {
        // Update dataSourceStyles in fileTree
        const newFileTree = traverseAndUpdate(state.fileTree, fileId, (node) => ({
          ...node,
          dataSourceStyles: {
            ...node.dataSourceStyles,
            [dataSourceId]: style
          }
        }))

        // Update dataSourceStyles in openTabs
        const newOpenTabs = state.openTabs.map(tab => 
          tab.id === fileId 
            ? { 
                ...tab, 
                dataSourceStyles: {
                  ...(tab as FileNode).dataSourceStyles,
                  [dataSourceId]: style
                }
              } 
            : tab
        )

        return {
          fileTree: newFileTree,
          openTabs: newOpenTabs
        }
      }),

      duplicateChart: (fileId, chartId) => set((state) => {
        // Find the file node
        const fileNode = findNodeById(state.fileTree, fileId)
        if (!fileNode || !fileNode.charts) return state

        // Find the chart to duplicate
        const chartToDuplicate = ChartOperations.findById(fileNode.charts, chartId)
        if (!chartToDuplicate) return state

        // Create a new chart
        const newChart = ChartOperations.duplicate(chartToDuplicate)

        // Update charts in fileTree
        const newFileTree = traverseAndUpdate(state.fileTree, fileId, (node) => {
          if (node.charts) {
            return { 
              ...node, 
              charts: ChartOperations.insertAfter(node.charts, chartId, newChart)
            }
          }
          return node
        })

        // Update charts in openTabs
        const newOpenTabs = state.openTabs.map(tab => {
          if (tab.id === fileId && tab.charts) {
            return { 
              ...tab, 
              charts: ChartOperations.insertAfter(tab.charts, chartId, newChart)
            }
          }
          return tab
        })

        return {
          fileTree: newFileTree,
          openTabs: newOpenTabs
        }
      }),

      deleteChart: (fileId, chartId) => set((state) => {
        // Update charts in fileTree
        const newFileTree = traverseAndUpdate(state.fileTree, fileId, (node) => {
          if (node.charts) {
            return { 
              ...node, 
              charts: ChartOperations.remove(node.charts, chartId)
            }
          }
          return node
        })

        // Update charts in openTabs
        const newOpenTabs = state.openTabs.map(tab => {
          if (tab.id === fileId && tab.charts) {
            return { 
              ...tab, 
              charts: ChartOperations.remove(tab.charts, chartId)
            }
          }
          return tab
        })

        return {
          fileTree: newFileTree,
          openTabs: newOpenTabs
        }
      }),

      deleteNode: (nodeId) => set((state) => {
        // Remove the node from the tree
        const removeNode = (nodes: FileNode[]): FileNode[] => {
          return nodes.reduce<FileNode[]>((acc, node) => {
            if (node.id === nodeId) {
              // Skip this node (delete it)
              return acc
            }
            const children = node.children ? removeNode(node.children) : undefined
            acc.push(children ? { ...node, children } : node)
            return acc
          }, [])
        }

        const newFileTree = removeNode(state.fileTree)

        // Also close the tab if it's open
        const newOpenTabs = state.openTabs.filter(tab => tab.id !== nodeId)
        const newActiveTab = state.activeTab === nodeId && newOpenTabs.length > 0
          ? newOpenTabs[newOpenTabs.length - 1].id
          : state.activeTab === nodeId
          ? ''
          : state.activeTab

        return {
          fileTree: newFileTree,
          openTabs: newOpenTabs,
          activeTab: newActiveTab
        }
      }),
    })),
    {
      name: 'file-store',
    }
  )
)

// Subscribe to state changes and save to localStorage
const saveToStorage = () => {
  const state = useFileStore.getState()
  const graphStateStore = useGraphStateStore.getState()
  
  graphStateStore.saveState({
    tabs: state.openTabs,
    activeTab: state.activeTab,
    fileTree: state.fileTree,
    uiState: {
      currentPage: 1, // This will be updated from UIStore
      sidebarOpen: true, // This will be updated from ViewStore
      activeView: 'explorer', // This will be updated from ViewStore
      expandedFolders: Array.from(state.expandedFolders)
    }
  })
}

// Subscribe to specific state changes
useFileStore.subscribe(
  (state) => ({ openTabs: state.openTabs, activeTab: state.activeTab, expandedFolders: state.expandedFolders, fileTree: state.fileTree }),
  saveToStorage
)