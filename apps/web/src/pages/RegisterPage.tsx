import { Card } from "@/components/ui/card"
import { RegisterForm } from "@/features/auth/components/RegisterForm"

interface RegisterPageProps {
  onSuccessCallback?: (email: string) => void
}

export const RegisterPage = ({ onSuccessCallback }: RegisterPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="px-6 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Create Account</h1>
            <p className="text-sm text-muted-foreground">
              Join us by filling in your details below
            </p>
          </div>

          <RegisterForm onSuccessCallback={onSuccessCallback} />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </div>
        </div>
      </Card>
    </div>
  )
}
