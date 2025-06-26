import React from "react"
import { SIZING, getSyntaxClasses } from "@/lib/styleConstants"

export const ExpressionLegend: React.FC = () => {
  const syntaxClasses = getSyntaxClasses()
  
  return (
    <div className="mt-4 pt-3 border-t border-muted">
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <span className={syntaxClasses.parameter}>parameters</span>
          <span className={syntaxClasses.operator}>&gt; &lt; =</span>
          <span className={syntaxClasses.value}>values</span>
          <span className={syntaxClasses.logical}>AND OR</span>
          <span className={syntaxClasses.grouping}>( )</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`${SIZING.indicator} bg-rose-600 rounded-full`}></span>
          <span>AND: All conditions must be true, OR: Any condition can be true</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`${SIZING.indicator} bg-amber-600 rounded-full`}></span>
          <span>( ): Grouped conditions for complex logic</span>
        </div>
      </div>
    </div>
  )
}