import { SignIn } from '@clerk/react'

export function SignInPage() {
  return (
    <main className="flex justify-center px-6 py-8">
      <SignIn fallbackRedirectUrl="/" path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </main>
  )
}
