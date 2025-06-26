"use client"

import React from "react"
import katex from "katex"
import "katex/dist/katex.min.css"
import { convertToLatex, shouldUseLatex } from "@/utils/formulaToLatex"
import { FormulaDisplay } from "./FormulaDisplay"
import { cn } from "@/lib/utils"

interface FormulaLatexDisplayProps {
  expression: string
  className?: string
  fallbackToSyntax?: boolean
}

export function FormulaLatexDisplay({ 
  expression, 
  className,
  fallbackToSyntax = true 
}: FormulaLatexDisplayProps) {
  const [html, setHtml] = React.useState<string>("")
  const [error, setError] = React.useState<boolean>(false)
  
  React.useEffect(() => {
    if (shouldUseLatex(expression)) {
      try {
        const latex = convertToLatex(expression)
        const rendered = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
          output: 'html'
        })
        setHtml(rendered)
        setError(false)
      } catch (err) {
        console.error("KaTeX rendering error:", err)
        setError(true)
      }
    } else {
      setError(true)
    }
  }, [expression])
  
  if (error && fallbackToSyntax) {
    return <FormulaDisplay expression={expression} className={className} />
  }
  
  if (error) {
    return <code className={cn("font-mono", className)}>{expression}</code>
  }
  
  return (
    <span 
      className={cn("katex-formula", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}