"use client"

import React from "react"
import { File, Folder, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileNode } from "@/types"
import { useAnalysisStore } from "@/stores/useAnalysisStore"

interface FileExplorerProps {
  fileTree: FileNode[]
}

export function FileExplorer({ fileTree }: FileExplorerProps) {
  const { expandedFolders, toggleFolder, openFile } = useAnalysisStore()

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer text-sm",
            `ml-${depth * 4}`
          )}
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
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === "folder" && expandedFolders.has(node.id) && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ))
  }

  return <div className="py-2">{renderFileTree(fileTree)}</div>
}