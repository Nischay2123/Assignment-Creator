import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type RegeneratePdfDialogProps = {
  isOpen: boolean
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const RegeneratePdfDialog = ({
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: RegeneratePdfDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Regenerate PDF?
          </DialogTitle>
          <DialogDescription>
            This will regenerate the PDF and replace the existing file. This action may
            take a few moments.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="default"
            disabled={isLoading}
          >
            {isLoading ? "Regenerating..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
