export function MissingClerkKey() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="text-xs font-bold tracking-[0.14em] text-secondary uppercase">Chess Club</p>
      <h1 className="mt-3 text-5xl font-bold tracking-normal">Add your Clerk key</h1>
      <p className="mt-4 text-muted-foreground">
        Create an application in the Clerk dashboard, then put the publishable key in{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">chess-club-ui/.env</code>.
      </p>
      <pre className="mt-5 overflow-x-auto rounded-lg bg-muted p-4">
        <code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code>
      </pre>
      <p className="mt-4 text-muted-foreground">
        Restart the dev server after saving the file. The same Clerk app’s secret key belongs in{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">chess-club-api/.env</code> as{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">CLERK_SECRET_KEY</code>, with the
        publishable key as{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">CLERK_PUBLISHABLE_KEY</code>.
      </p>
    </main>
  )
}
