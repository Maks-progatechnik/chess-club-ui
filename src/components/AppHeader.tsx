import { ClerkLoading, Show, UserButton } from '@clerk/react'
import { Link } from 'react-router-dom'

export function AppHeader() {
  return (
    <header className="app-header">
      <Link className="brand" to="/">
        <span aria-hidden="true" className="brand-mark">
          ♞
        </span>
        Chess Club
      </Link>
      <nav className="header-nav">
        <ClerkLoading>
          <span className="auth-pending">Loading</span>
        </ClerkLoading>
        <Show when="signed-out">
          <Link to="/sign-in">Sign in</Link>
          <Link className="button" to="/sign-up">
            Join
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </nav>
    </header>
  )
}
