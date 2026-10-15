import { Route, Routes } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader.tsx'
import { HomePage } from '@/pages/HomePage.tsx'
import { SignInPage } from '@/pages/SignInPage.tsx'
import { SignUpPage } from '@/pages/SignUpPage.tsx'

function App() {
  return (
    <div className="min-h-svh">
      <AppHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
      </Routes>
    </div>
  )
}

export default App
