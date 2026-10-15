import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { MissingClerkKey } from './components/MissingClerkKey.tsx'
import './index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

createRoot(root).render(
  <StrictMode>
    {publishableKey ? (
      <ClerkProvider
        publishableKey={publishableKey}
        afterSignOutUrl="/"
        appearance={{
          variables: {
            colorForeground: '#2e3532',
            colorPrimary: '#2e3532',
            colorPrimaryForeground: '#f7f6f4',
            fontFamily: 'Courier New',
            fontFamilyButtons: 'Courier New',
          },
        }}
        signInFallbackRedirectUrl="/"
        signInUrl="/sign-in"
        signUpFallbackRedirectUrl="/"
        signUpUrl="/sign-up"
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <MissingClerkKey />
    )}
  </StrictMode>,
)
