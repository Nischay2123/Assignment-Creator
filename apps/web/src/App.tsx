
import { useState } from "react"
import { RegisterPage } from "@/pages/RegisterPage"
import { OtpPage } from "@/pages/OtpPage"
import { SuccessPage } from "@/pages/SuccessPage"

type AppPage = "register" | "otp" | "success"

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>("register")
  const [registrationEmail, setRegistrationEmail] = useState("")

  const handleRegistrationSuccess = (email: string) => {
    setRegistrationEmail(email)
    setCurrentPage("otp")
  }

  const handleOtpSuccess = () => {
    setCurrentPage("success")
  }

  const handleBackToRegister = () => {
    setRegistrationEmail("")
    setCurrentPage("register")
  }

  const handleRestart = () => {
    setCurrentPage("register")
    setRegistrationEmail("")
  }

  return (
    <>
      {currentPage === "register" && <RegisterPage onSuccessCallback={handleRegistrationSuccess} />}
      {currentPage === "otp" && (
        <OtpPage 
          email={registrationEmail} 
          onSuccessCallback={handleOtpSuccess}
          onBackCallback={handleBackToRegister}
        />
      )}
      {currentPage === "success" && <SuccessPage onRestart={handleRestart} />}
    </>
  )
}

export default App
