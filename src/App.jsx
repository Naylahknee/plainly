import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import SignIn from './pages/SignIn'
import AuthCallback from './pages/AuthCallback'
import Projects from './pages/Projects'
import Files from './pages/Files'
import History from './pages/History'
import Help from './pages/Help'
import ProjectTimeline from './pages/ProjectTimeline'

export default function App() {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <div className="loading-screen">
        <div className="wordmark">plainly</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback onSignIn={auth.signIn} />} />
        <Route path="/" element={auth.token ? <Projects auth={auth} /> : <SignIn />} />
        <Route path="/p/:repo" element={auth.token ? <Files auth={auth} /> : <Navigate to="/" replace />} />
        <Route path="/p/:repo/h/*" element={auth.token ? <History auth={auth} /> : <Navigate to="/" replace />} />
        <Route path="/p/:repo/timeline" element={auth.token ? <ProjectTimeline auth={auth} /> : <Navigate to="/" replace />} />
        <Route path="/help" element={<Help auth={auth} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
