import { SignUp } from '@clerk/react'

export function SignUpPage() {
  return (
    <main className="flex justify-center px-6 py-8">
      <SignUp fallbackRedirectUrl="/" path="/sign-up" routing="path" signInUrl="/sign-in" />
    </main>
  )
}
