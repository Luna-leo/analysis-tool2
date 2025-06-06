import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface SaveConditionDialogProps {
  isOpen: boolean
  onClose: () => void
  conditionName: string
  onConditionNameChange: (name: string) => void
  onSave: () => void
  getCurrentExpressionJSX: () => React.ReactNode
}

export const SaveConditionDialog: React.FC<SaveConditionDialogProps> = ({
  isOpen,
  onClose,
  conditionName,
  onConditionNameChange,
  onSave,
  getCurrentExpressionJSX
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>トリガー信号条件を登録</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="condition-name">条件名 <span className="text-red-500">*</span></Label>
            <Input
              id="condition-name"
              value={conditionName}
              onChange={(e) => onConditionNameChange(e.target.value)}
              placeholder="条件に名前を付けてください"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">保存される条件式:</Label>
            <div className="mt-1 p-3 border rounded bg-muted/20 font-mono text-xs break-words">
              {getCurrentExpressionJSX()}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onSave}
            disabled={!conditionName.trim()}
          >
            登録
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}