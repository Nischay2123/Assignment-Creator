import { Card } from "@/components/ui/card"
import { LoginForm } from "@/features/auth/components/LoginForm"

interface LoginPageProps {
  onSuccessCallback?: () => void
  onBackToRegister?: () => void
}

export const LoginPage = ({ onSuccessCallback, onBackToRegister }: LoginPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="px-6 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue to your dashboard
            </p>
          </div>

          <LoginForm onSuccessCallback={onSuccessCallback} />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onBackToRegister}
              className="text-primary hover:underline"
            >
              Create one
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}