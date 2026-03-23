import { useOtpVerification } from "../hooks/useOtpVerification"
import { InputField } from "@/shared/components/form/InputField"
import { ErrorMessage } from "@/shared/components/form/ErrorMessage"
import { Button } from "@/components/ui/button"

interface OtpFormProps {
  email: string
  onSuccessCallback?: (token: string) => void
}

export const OtpForm = ({ email, onSuccessCallback }: OtpFormProps) => {
  const { otp, isSubmitting, submitError, submitSuccess, resendLoading, handleOtpChange, handleSubmit, handleResendOtp, isSubmitDisabled } = useOtpVerification(email, onSuccessCallback)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submitError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <ErrorMessage message={submitError} />
        </div>
      )}

      {submitSuccess && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-600 dark:text-green-400">
            Email verified successfully! Redirecting...
          </p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit OTP sent to <span className="font-medium">{email}</span>
        </p>
      </div>

      <InputField
        label="One-Time Password"
        placeholder="000000"
        value={otp}
        onChange={(e) => handleOtpChange(e.target.value)}
        error=""
        disabled={isSubmitting}
        maxLength={6}
        inputMode="numeric"
        className="text-center text-lg tracking-widest font-mono"
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitDisabled}
      >
        {isSubmitting ? "Verifying..." : "Verify OTP"}
      </Button>

      <div className="space-y-3">
        <p className="text-xs text-center text-muted-foreground">
          Didn't receive the code?
        </p>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={handleResendOtp}
          disabled={resendLoading || isSubmitting}
        >
          {resendLoading ? "Sending..." : "Resend OTP"}
        </Button>
      </div>
    </form>
  )
}
