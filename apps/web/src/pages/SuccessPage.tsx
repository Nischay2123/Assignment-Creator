import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface SuccessPageProps {
  onRestart?: () => void
}

export const SuccessPage = ({ onRestart }: SuccessPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="px-6 py-8">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Registration Complete!</h1>
            <p className="text-sm text-muted-foreground">
              Your email has been verified successfully. You can now log in to your account.
            </p>
          </div>

          <div className="space-y-3">
            <Button className="w-full" onClick={onRestart}>
              Go to Login
            </Button>

            <Button variant="outline" className="w-full" onClick={onRestart}>
              Back to Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
