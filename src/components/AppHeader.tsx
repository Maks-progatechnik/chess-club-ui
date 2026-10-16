import { ClerkLoading, Show, UserButton } from '@clerk/react'
import { Link, NavLink } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppHeader() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-6">
      <Link className="flex items-center gap-3 text-xl text-foreground no-underline" to="/">
        <span className="grid size-9 place-items-center rounded-lg bg-secondary text-lg text-secondary-foreground">
          ♞
        </span>
        Chess Club
      </Link>
      <nav className="flex items-center gap-4">
        <ClerkLoading>
          <span className="text-sm text-muted-foreground">Loading</span>
        </ClerkLoading>
        <Show when="signed-out">
          <Link className="font-semibold text-secondary underline underline-offset-4" to="/sign-in">
            Sign in
          </Link>
          <Link className={cn(buttonVariants(), 'hover:bg-secondary')} to="/sign-up">
            Join
          </Link>
        </Show>
        <Show when="signed-in">
          <NavLink
            className={({ isActive }) =>
              cn(
                'font-semibold underline-offset-4',
                isActive ? 'text-secondary underline' : 'text-foreground no-underline',
              )
            }
            to="/me"
          >
            Me
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              cn(
                'font-semibold underline-offset-4',
                isActive ? 'text-secondary underline' : 'text-foreground no-underline',
              )
            }
            to="/members"
          >
            Members
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              cn(
                'font-semibold underline-offset-4',
                isActive ? 'text-secondary underline' : 'text-foreground no-underline',
              )
            }
            to="/draw"
          >
            Draw
          </NavLink>
          <UserButton />
        </Show>
      </nav>
    </header>
  )
}
