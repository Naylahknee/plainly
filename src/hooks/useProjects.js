/**
 * useProjects.js — one place that loads your projects and applies your choice.
 *
 * Home, My Projects and Recent Activity each called getRepos() separately.
 * That is exactly the shape of duplication that let the "Continue with AI"
 * link drift out of step with the sidebar, so the filter lives here rather
 * than being written out three times.
 */

import { useEffect, useState } from 'react'
import { getRepos } from '../api/github'
import { visibleProjects } from '../utils/projectPicker'

export function useProjects(auth) {
  const token = auth?.token
  const login = auth?.user?.login

  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    getRepos(token)
      .then(repos => {
        if (cancelled) return
        setAll(repos || [])
        setTruncated(Boolean(repos?.truncated))
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  const projects = visibleProjects(login, all)

  return {
    projects,                                 // what to show
    allProjects: all,                         // everything GitHub returned
    hiddenCount: all.length - projects.length,
    truncated,                                // more than the page cap exists
    loading,
    error,
  }
}
