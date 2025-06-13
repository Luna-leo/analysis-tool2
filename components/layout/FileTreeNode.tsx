"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChartLine, Folder, ChevronRight, ChevronDown, MoreVertical, Edit2, FilePlus, FolderPlus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileNode } from "@/types"
import { useFileStore } from "@/stores/useFileStore"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FileTreeNodeProps {
  node: FileNode
  depth?: number
}

export function FileTreeNode({ node, depth = 0 }: FileTreeNodeProps) {
  const {
    expandedFolders,
    toggleFolder,
    openFile,
    renamingNode,
    setRenamingNode,
    renameNode,
    creatingNodeType,
    creatingNodeParentId,
    setCreatingNode,
    createNewFolder,
    createNewFile,
    draggedNode,
    dragOverNode,
    dragPosition,
    setDraggedNode,
    setDragOverNode,
    moveNode,
    deleteNode,
  } = useFileStore()

  const [tempName, setTempName] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if ((renamingNode === node.id || creatingNodeParentId === node.id) && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renamingNode, creatingNodeParentId, node.id])

  const handleRename = () => {
    setTempName(node.name)
    setRenamingNode(node.id)
  }

  const handleRenameSubmit = () => {
    if (tempName.trim()) {
      renameNode(node.id, tempName.trim())
    }
    setRenamingNode(null)
    setTempName("")
  }

  const handleCreateSubmit = () => {
    if (tempName.trim() && creatingNodeType) {
      if (creatingNodeType === "folder") {
        createNewFolder(node.id, tempName.trim())
      } else {
        createNewFile(node.id, tempName.trim())
      }
    }
    setCreatingNode(null, null)
    setTempName("")
  }

  const handleRenameCancel = () => {
    setRenamingNode(null)
    setCreatingNode(null, null)
    setTempName("")
  }

  const handleDragStart = (e: React.DragEvent) => {
    setDraggedNode(node.id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", node.id)
  }

  const handleDragOver = (e: React.DragEvent, position: "before" | "after" | "inside") => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedNode && draggedNode !== node.id) {
      setDragOverNode(node.id, position)
      e.dataTransfer.dropEffect = "move"
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverNode(null, null)
    }
  }

  const handleDrop = (e: React.DragEvent, position: "before" | "after" | "inside") => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedNode && draggedNode !== node.id) {
      moveNode(draggedNode, node.id, position)
    }

    setDraggedNode(null)
    setDragOverNode(null, null)
  }

  const handleDragEnd = () => {
    setDraggedNode(null)
    setDragOverNode(null, null)
  }

  const getDropIndicatorClass = (position: "before" | "after" | "inside") => {
    if (dragOverNode === node.id && dragPosition === position && draggedNode) {
      switch (position) {
        case "before":
          return "border-t-2 border-blue-500"
        case "after":
          return "border-b-2 border-blue-500"
        case "inside":
          return "bg-blue-50 border-blue-200 border-2 border-dashed"
        default:
          return ""
      }
    }
    return ""
  }

  return (
    <>
      <div>
      <div
        className={cn("h-1 transition-all", getDropIndicatorClass("before"))}
        onDragOver={(e) => handleDragOver(e, "before")}
        onDrop={(e) => handleDrop(e, "before")}
      />
      <div
        draggable={renamingNode === null && creatingNodeType === null}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          if (node.type === "folder") {
            handleDragOver(e, "inside")
          } else {
            e.preventDefault()
          }
        }}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          if (node.type === "folder") {
            handleDrop(e, "inside")
          }
        }}
        className={cn(
          "group flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer text-base relative transition-all",
          `ml-${depth * 4}`,
          draggedNode === node.id && "opacity-50",
          getDropIndicatorClass("inside")
        )}
      >
        <div
          className="flex items-center gap-2 flex-1"
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder(node.id)
            } else {
              openFile(node)
            }
          }}
        >
          {node.type === "folder" ? (
            <>
              {expandedFolders.has(node.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="h-4 w-4" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <ChartLine className="h-4 w-4" />
            </>
          )}
          {renamingNode === node.id ? (
            <Input
              ref={inputRef}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameSubmit()
                } else if (e.key === "Escape") {
                  handleRenameCancel()
                }
              }}
              className="h-6 py-0 px-1 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleRename()
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            {node.type === "folder" && (
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setCreatingNode("folder", node.id)
                    setTempName("")
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setCreatingNode("file", node.id)
                    setTempName("")
                  }}
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  New File
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteDialog(true)
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {node.type === "folder" && expandedFolders.has(node.id) && (
        <div>
          {node.children && node.children.map((child) => (
            <FileTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
          {creatingNodeParentId === node.id && creatingNodeType && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-base",
                `ml-${(depth + 1) * 4}`
              )}
            >
              <div className="w-4" />
              {creatingNodeType === "folder" ? (
                <Folder className="h-4 w-4" />
              ) : (
                <ChartLine className="h-4 w-4" />
              )}
              <Input
                ref={inputRef}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleCreateSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateSubmit()
                  } else if (e.key === "Escape") {
                    handleRenameCancel()
                  }
                }}
                placeholder={creatingNodeType === "folder" ? "New folder name" : "New file name"}
                className="h-6 py-0 px-1 text-sm"
              />
            </div>
          )}
        </div>
      )}
      <div
        className={cn("h-1 transition-all", getDropIndicatorClass("after"))}
        onDragOver={(e) => handleDragOver(e, "after")}
        onDrop={(e) => handleDrop(e, "after")}
      />
    </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {node.type === "folder" ? "folder" : "file"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{node.name}"?
              {node.type === "folder" && node.children && node.children.length > 0 && (
                <> This folder contains {node.children.length} item{node.children.length !== 1 ? "s" : ""} that will also be deleted.</>
              )}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNode(node.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

