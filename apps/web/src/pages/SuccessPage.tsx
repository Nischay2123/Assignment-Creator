import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface SuccessPageProps {
  userName?: string
  userEmail?: string
  onGoToLogin?: () => void
  onBackToRegister?: () => void
}

export const SuccessPage = ({ userName, userEmail, onGoToLogin, onBackToRegister }: SuccessPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="px-6 py-8">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Login Successful</h1>
            <p className="text-sm text-muted-foreground">
              You are now authenticated and your session is active in browser cookies.
            </p>
            <p className="text-sm mt-3 text-foreground font-medium">{userName ?? "User"}</p>
            {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}
          </div>

          <div className="space-y-3">
            <Button className="w-full" onClick={onGoToLogin}>
              Logout to Login
            </Button>

            <Button variant="outline" className="w-full" onClick={onBackToRegister}>
              Back to Registration
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
