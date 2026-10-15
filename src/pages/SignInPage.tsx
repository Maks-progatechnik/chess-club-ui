import { SignIn } from '@clerk/react'

export function SignInPage() {
  return (
    <main className="auth-page">
      <SignIn fallbackRedirectUrl="/" path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </main>
  )
}
