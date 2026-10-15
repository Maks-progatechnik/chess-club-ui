export function MissingClerkKey() {
  return (
    <main className="setup-page">
      <p className="eyebrow">Chess Club</p>
      <h1>Add your Clerk key</h1>
      <p>
        Create an application in the Clerk dashboard, then put the publishable
        key in <code>chess-club-ui/.env</code>.
      </p>
      <pre>
        <code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code>
      </pre>
      <p>
        Restart the dev server after saving the file. The same Clerk app’s
        secret key belongs in <code>chess-club-api/.env</code> as{' '}
        <code>CLERK_SECRET_KEY</code>, with the publishable key as{' '}
        <code>CLERK_PUBLISHABLE_KEY</code>.
      </p>
    </main>
  )
}
