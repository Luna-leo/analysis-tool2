import React from "react"

export const WelcomeMessage: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-xl">Select a file from the explorer to view charts</p>
      </div>
    </div>
  )
}