import { SignUp } from '@clerk/react'

export function SignUpPage() {
  return (
    <main className="auth-page">
      <SignUp fallbackRedirectUrl="/" path="/sign-up" routing="path" signInUrl="/sign-in" />
    </main>
  )
}
