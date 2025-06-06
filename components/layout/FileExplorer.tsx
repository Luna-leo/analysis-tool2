"use client"

import React, { useState, useRef, useEffect } from "react"
import { File, Folder, ChevronRight, ChevronDown, MoreVertical, Edit2, Plus, FilePlus, FolderPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileNode } from "@/types"
import { useAnalysisStore } from "@/stores/useAnalysisStore"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function FileExplorer() {
  const { 
    fileTree, 
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
    createNewFile
  } = useAnalysisStore()
  const [tempName, setTempName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if ((renamingNode || creatingNodeType) && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renamingNode, creatingNodeType])

  const handleRename = (nodeId: string, currentName: string) => {
    setTempName(currentName)
    setRenamingNode(nodeId)
  }

  const handleRenameSubmit = (nodeId: string) => {
    if (tempName.trim()) {
      renameNode(nodeId, tempName.trim())
    }
    setRenamingNode(null)
    setTempName("")
  }

  const handleCreateSubmit = () => {
    if (tempName.trim() && creatingNodeType) {
      if (creatingNodeType === "folder") {
        createNewFolder(creatingNodeParentId, tempName.trim())
      } else {
        createNewFile(creatingNodeParentId, tempName.trim())
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

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer text-sm relative",
            `ml-${depth * 4}`
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
                <File className="h-4 w-4" />
              </>
            )}
            {renamingNode === node.id ? (
              <Input
                ref={inputRef}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => handleRenameSubmit(node.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameSubmit(node.id)
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
                  handleRename(node.id, node.name)
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
                    }}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setCreatingNode("file", node.id)
                    }}
                  >
                    <FilePlus className="h-4 w-4 mr-2" />
                    New File
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {node.type === "folder" && expandedFolders.has(node.id) && (
          <div>
            {node.children && renderFileTree(node.children, depth + 1)}
            {creatingNodeParentId === node.id && creatingNodeType && (
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1 text-sm",
                  `ml-${(depth + 1) * 4}`
                )}
              >
                <div className="w-4" />
                {creatingNodeType === "folder" ? (
                  <Folder className="h-4 w-4" />
                ) : (
                  <File className="h-4 w-4" />
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
      </div>
    ))
  }

  return (
    <div className="py-2">
      {renderFileTree(fileTree)}
      {creatingNodeParentId === null && creatingNodeType && (
        <div className="flex items-center gap-2 px-2 py-1 text-sm">
          {creatingNodeType === "folder" ? (
            <Folder className="h-4 w-4" />
          ) : (
            <File className="h-4 w-4" />
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
  )
}