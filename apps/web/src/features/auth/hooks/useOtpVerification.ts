import { useState, useCallback } from "react"
import { useVerifyOtpMutation } from "../api/authApi"

interface UseOtpVerificationReturn {
  otp: string
  isSubmitting: boolean
  submitError: string | null
  submitSuccess: boolean
  resendLoading: boolean
  handleOtpChange: (value: string) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  handleResendOtp: () => Promise<void>
  isSubmitDisabled: boolean
}

export const useOtpVerification = (email: string, onSuccessCallback?: (token: string) => void): UseOtpVerificationReturn => {
  const [otp, setOtp] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const [verifyOtp, { isLoading: isVerifyLoading }] = useVerifyOtpMutation()

  const handleOtpChange = useCallback((value: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6)
    setOtp(numericValue)
    setSubmitError(null)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setSubmitError(null)

      if (otp.length !== 6) {
        setSubmitError("Please enter a 6-digit OTP")
        return
      }

      setIsSubmitting(true)

      try {
        const result = await verifyOtp({
          email,
          otp,
        }).unwrap()

        setSubmitSuccess(true)

        // Call callback with token
        if (onSuccessCallback) {
          setTimeout(() => {
            onSuccessCallback(result.token)
          }, 500)
        }
      } catch (error: any) {
        const message = error?.data?.message || "OTP verification failed. Please try again."
        setSubmitError(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [otp, email, verifyOtp, onSuccessCallback]
  )

  const handleResendOtp = useCallback(async () => {
    setResendLoading(true)
    setSubmitError(null)

    try {
      // For now, just show a message
      // In a real app, you'd call a resend OTP endpoint
      setSubmitError(null)
      alert("OTP resent to your email")
    } catch (error: any) {
      const message = error?.data?.message || "Failed to resend OTP. Please try again."
      setSubmitError(message)
    } finally {
      setResendLoading(false)
    }
  }, [])

  const isSubmitDisabled = otp.length !== 6 || isSubmitting || isVerifyLoading

  return {
    otp,
    isSubmitting: isSubmitting || isVerifyLoading,
    submitError,
    submitSuccess,
    resendLoading,
    handleOtpChange,
    handleSubmit,
    handleResendOtp,
    isSubmitDisabled,
  }
}
