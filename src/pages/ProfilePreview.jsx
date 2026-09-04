import InteractiveProfile from '../components/InteractiveProfile'

// Small usage example. It uses the connected GitHub identity when present,
// otherwise InteractiveProfile supplies its neutral, configurable defaults.
export default function ProfilePreview({ auth }) {
  const user = auth?.user
  const profile = user
    ? {
        name: user.name || user.login,
        image: user.avatar_url,
        links: [{ label: 'GitHub', href: user.html_url || `https://github.com/${user.login}`, icon: 'github' }],
      }
    : undefined

  return <InteractiveProfile profile={profile} />
}
