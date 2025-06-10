"use client"

import React, { useState, useRef, useEffect } from "react"
import { File, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFileStore } from "@/stores/useFileStore"
import { Input } from "@/components/ui/input"
import { FileTreeNode } from "./FileTreeNode"

export function FileExplorer() {
  const {
    fileTree,
    creatingNodeType,
    creatingNodeParentId,
    setCreatingNode,
    createNewFolder,
    createNewFile,
    draggedNode,
    dragOverNode,
    dragPosition,
    setDragOverNode,
    moveNode,
    setDraggedNode,
  } = useFileStore()

  const [tempName, setTempName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creatingNodeParentId === null && creatingNodeType && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [creatingNodeParentId, creatingNodeType])

  const handleCreateSubmit = () => {
    if (tempName.trim() && creatingNodeType) {
      if (creatingNodeType === "folder") {
        createNewFolder(null, tempName.trim())
      } else {
        createNewFile(null, tempName.trim())
      }
    }
    setCreatingNode(null, null)
    setTempName("")
  }

  const handleCancel = () => {
    setCreatingNode(null, null)
    setTempName("")
  }

  return (
    <div
      className="py-2"
      onDragOver={(e) => {
        if (fileTree.length === 0) {
          e.preventDefault()
          setDragOverNode(null, "inside")
        }
      }}
      onDrop={(e) => {
        if (draggedNode && fileTree.length === 0) {
          e.preventDefault()
          moveNode(draggedNode, null, "inside")
          setDraggedNode(null)
          setDragOverNode(null, null)
        }
      }}
    >
      {fileTree.map((node) => (
        <FileTreeNode key={node.id} node={node} depth={0} />
      ))}

      {fileTree.length > 0 && (
        <div
          className={cn(
            "h-2 transition-all",
            dragOverNode === null && dragPosition === "inside" && draggedNode
              ? "bg-blue-50 border-blue-200 border-2 border-dashed rounded"
              : ""
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOverNode(null, "inside")
          }}
          onDrop={(e) => {
            if (draggedNode) {
              e.preventDefault()
              moveNode(draggedNode, null, "inside")
              setDraggedNode(null)
              setDragOverNode(null, null)
            }
          }}
        />
      )}

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
                handleCancel()
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

