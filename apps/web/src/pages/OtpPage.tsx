import { Card } from "@/components/ui/card"
import { OtpForm } from "@/features/auth/components/OtpForm"
import { Button } from "@/components/ui/button"

interface OtpPageProps {
  email: string
  onSuccessCallback?: (token: string) => void
  onBackCallback?: () => void
}

export const OtpPage = ({ email, onSuccessCallback, onBackCallback }: OtpPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="px-6 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Verify Email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent a 6-digit code to your email
            </p>
          </div>

          <OtpForm email={email} onSuccessCallback={onSuccessCallback} />

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Want to use a different email?{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-primary hover:underline"
              onClick={onBackCallback}
            >
              Go back to registration
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
