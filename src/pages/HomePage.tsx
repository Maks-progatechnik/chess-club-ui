import { Show, useUser } from '@clerk/react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20">
      <Show when="signed-out">
        <SignedOutHome />
      </Show>
      <Show when="signed-in">
        <SignedInHome />
      </Show>
    </main>
  )
}

function SignedOutHome() {
  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Members only</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">A quiet place to play.</h1>
      <p className="mt-4 text-lg text-muted-foreground">Sign in to see the club and the autumn tournament.</p>
      <div className="mt-7 flex flex-wrap items-center gap-5">
        <Link className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')} to="/sign-up">
          Join the club
        </Link>
        <Link className="font-semibold text-secondary underline underline-offset-4" to="/sign-in">
          I already have an account
        </Link>
      </div>
    </section>
  )
}

function SignedInHome() {
  const { user } = useUser()
  const name = user?.fullName || user?.username || 'member'

  return (
    <section className="max-w-xl">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Signed in</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight tracking-normal">Welcome back, {name}.</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The autumn registration is in, and the member list is up.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-5">
        <Link className={cn(buttonVariants({ size: 'lg' }), 'hover:bg-secondary')} to="/autumn">
          Autumn registration
        </Link>
        <Link className="font-semibold text-secondary underline underline-offset-4" to="/draw">
          Draw
        </Link>
        <Link className="font-semibold text-secondary underline underline-offset-4" to="/members">
          Members
        </Link>
      </div>
    </section>
  )
}
