import React from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FileNode } from "@/types"
import { useFileStore } from "@/stores/useFileStore"

interface BreadcrumbNavigationProps {
  activeTab: string
  openTabs: Array<{ id: string; name: string }>
}

// Helper function to get file path
const getFilePath = (fileId: string, nodes: FileNode[], path: string[] = []): string[] | null => {
  for (const node of nodes) {
    const currentPath = [...path, node.name]

    if (node.id === fileId) {
      return currentPath
    }

    if (node.children) {
      const result = getFilePath(fileId, node.children, currentPath)
      if (result) {
        return result
      }
    }
  }
  return null
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  activeTab,
  openTabs,
}) => {
  const { fileTree } = useFileStore()
  const currentFile = openTabs.find((tab) => tab.id === activeTab)
  
  if (!currentFile) return null

  const filePath = getFilePath(currentFile.id, fileTree)

  return (
    <div className="border-b bg-background flex items-center h-5">
      <div className="px-4 -my-0.5">
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            {filePath ? (
              filePath.map((pathItem, index) => (
              <React.Fragment key={index}>
                {index === filePath.length - 1 ? (
                  <BreadcrumbItem>
                    <BreadcrumbPage className="leading-none">{pathItem}</BreadcrumbPage>
                  </BreadcrumbItem>
                ) : (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#" className="text-muted-foreground leading-none">
                        {pathItem}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}
              </React.Fragment>
            ))
            ) : (
              // If no file path found (e.g., for special tabs or reconstructed files)
              <BreadcrumbItem>
                <BreadcrumbPage className="leading-none">{currentFile.name}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  )
}