import { Route, Routes } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader.tsx'
import { AutumnPage } from '@/pages/AutumnPage.tsx'
import { DrawPage } from '@/pages/DrawPage.tsx'
import { HomePage } from '@/pages/HomePage.tsx'
import { MembersPage } from '@/pages/MembersPage.tsx'
import { SignInPage } from '@/pages/SignInPage.tsx'
import { SignUpPage } from '@/pages/SignUpPage.tsx'

function App() {
  return (
    <div className="min-h-svh">
      <AppHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/autumn" element={<AutumnPage />} />
        <Route path="/draw" element={<DrawPage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
      </Routes>
    </div>
  )
}

export default App
