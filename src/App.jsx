import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Layout
import AppShell from './components/AppShell'

// Auth pages (no shell)
import SignIn       from './pages/SignIn'
import AuthCallback from './pages/AuthCallback'
import Welcome      from './pages/Welcome'

// Global pages
import Home        from './pages/Home'
import Projects    from './pages/Projects'
import Activity    from './pages/Activity'
import Account     from './pages/Account'
import NewProject  from './pages/NewProject'
import Help        from './pages/Help'

// Project pages
import ProjectHome    from './pages/ProjectHome'
import Updates        from './pages/Updates'
import NewUpdate      from './pages/NewUpdate'
import Files          from './pages/Files'
import ProjectFiles   from './pages/ProjectFiles'
import ReviewAndSave  from './pages/ReviewAndSave'
import WhatChanged    from './pages/WhatChanged'
import SavePoints     from './pages/SavePoints'
import Versions       from './pages/Versions'
import Share          from './pages/Share'
import Settings       from './pages/Settings'
import History        from './pages/History'

// Update pages
import UpdateWorkspace  from './pages/UpdateWorkspace'
import ContinueWithAI   from './pages/ContinueWithAI'
import ReturnFromAI     from './pages/ReturnFromAI'
import ReviewAIChanges  from './pages/ReviewAIChanges'

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Wraps a page in AppShell. Redirects to "/" if not authenticated.
 */
function Protected({ auth, children }) {
  if (!auth.token) return <Navigate to="/" replace />
  return <AppShell auth={auth}>{children}</AppShell>
}

// ── App ──────────────────────────────────────────────────────────────────────

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
        {/* ── Auth (no shell) ─────────────────────────────────────── */}
        <Route path="/auth/callback" element={<AuthCallback onSignIn={auth.signIn} />} />

        {/* ── Root ───────────────────────────────────────────────── */}
        <Route
          path="/"
          element={
            auth.token
              ? <Protected auth={auth}><Home auth={auth} /></Protected>
              : <Welcome />
          }
        />

        {/* ── Global pages ────────────────────────────────────────── */}
        <Route path="/projects"  element={<Protected auth={auth}><Projects  auth={auth} /></Protected>} />
        <Route path="/activity"  element={<Protected auth={auth}><Activity  auth={auth} /></Protected>} />
        <Route path="/account"   element={<Protected auth={auth}><Account   auth={auth} /></Protected>} />
        <Route path="/new"       element={<Protected auth={auth}><NewProject auth={auth} /></Protected>} />
        <Route path="/help"      element={<Protected auth={auth}><Help      auth={auth} /></Protected>} />

        {/* ── Project pages ───────────────────────────────────────── */}
        <Route path="/p/:repo"             element={<Protected auth={auth}><ProjectHome  auth={auth} /></Protected>} />
        <Route path="/p/:repo/updates"     element={<Protected auth={auth}><Updates      auth={auth} /></Protected>} />
        <Route path="/p/:repo/new-update"  element={<Protected auth={auth}><NewUpdate    auth={auth} /></Protected>} />
        <Route path="/p/:repo/files"       element={<Protected auth={auth}><ProjectFiles auth={auth} /></Protected>} />
        <Route path="/p/:repo/f/*"         element={<Protected auth={auth}><Files        auth={auth} /></Protected>} />
        <Route path="/p/:repo/save"        element={<Protected auth={auth}><ReviewAndSave auth={auth} /></Protected>} />
        <Route path="/p/:repo/changed"     element={<Protected auth={auth}><WhatChanged  auth={auth} /></Protected>} />
        <Route path="/p/:repo/points"      element={<Protected auth={auth}><SavePoints   auth={auth} /></Protected>} />
        <Route path="/p/:repo/versions"    element={<Protected auth={auth}><Versions     auth={auth} /></Protected>} />
        <Route path="/p/:repo/share"       element={<Protected auth={auth}><Share        auth={auth} /></Protected>} />
        <Route path="/p/:repo/settings"    element={<Protected auth={auth}><Settings     auth={auth} /></Protected>} />
        <Route path="/p/:repo/h/*"         element={<Protected auth={auth}><History      auth={auth} /></Protected>} />

        {/* ── Update pages ────────────────────────────────────────── */}
        <Route path="/p/:repo/u/:updateId"        element={<Protected auth={auth}><UpdateWorkspace auth={auth} /></Protected>} />
        <Route path="/p/:repo/u/:updateId/ai"     element={<Protected auth={auth}><ContinueWithAI  auth={auth} /></Protected>} />
        <Route path="/p/:repo/u/:updateId/return" element={<Protected auth={auth}><ReturnFromAI    auth={auth} /></Protected>} />
        <Route path="/p/:repo/u/:updateId/review" element={<Protected auth={auth}><ReviewAIChanges auth={auth} /></Protected>} />

        {/* ── Catch-all ───────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
