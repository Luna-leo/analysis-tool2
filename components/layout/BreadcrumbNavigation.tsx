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
import { mockFileTree } from "@/data/mockData"

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
  const currentFile = openTabs.find((tab) => tab.id === activeTab)
  if (!currentFile) return null

  const filePath = getFilePath(currentFile.id, mockFileTree)
  if (!filePath) return null

  return (
    <div className="border-b bg-background px-4 py-2">
      <Breadcrumb>
        <BreadcrumbList>
          {filePath.map((pathItem, index) => (
            <React.Fragment key={index}>
              {index === filePath.length - 1 ? (
                <BreadcrumbItem>
                  <BreadcrumbPage>{pathItem}</BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" className="text-muted-foreground">
                      {pathItem}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}