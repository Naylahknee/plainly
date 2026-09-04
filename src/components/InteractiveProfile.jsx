import { useMemo, useState } from 'react'
import './InteractiveProfile.css'

const DEFAULT_PROFILE = {
  name: 'Alex Morgan',
  eyebrow: 'Hello, I’m',
  bio: 'Creative engineer blending hardware and software to build thoughtful products across artificial intelligence, robotics, and digital experiences.',
  image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=90',
  links: [
    { label: 'Website', href: 'https://example.com', icon: 'website' },
    { label: 'GitHub', href: 'https://github.com', icon: 'github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: 'linkedin' },
    { label: 'Email', href: 'mailto:hello@example.com', icon: 'email' },
    { label: 'Social profile', href: 'https://x.com', icon: 'social' },
  ],
}

function Icon({ name }) {
  const common = { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (name === 'plus') return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
  if (name === 'back') return <svg {...common}><path d="m14 6-6 6 6 6" /><path d="M8 12h11" /></svg>
  if (name === 'bio') return <svg {...common}><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>
  if (name === 'website') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
  if (name === 'github') return <svg {...common} fill="currentColor" stroke="none"><path d="M12 2.6a9.6 9.6 0 0 0-3.04 18.71c.48.09.65-.21.65-.46v-1.68c-2.65.58-3.21-1.13-3.21-1.13-.43-1.1-1.06-1.4-1.06-1.4-.87-.59.07-.58.07-.58.96.07 1.47.99 1.47.99.86 1.46 2.24 1.04 2.79.8.09-.62.33-1.04.6-1.28-2.11-.24-4.33-1.05-4.33-4.7 0-1.04.37-1.89.98-2.56-.1-.24-.43-1.21.09-2.52 0 0 .8-.26 2.64.98A9.1 9.1 0 0 1 12 6.95c.82 0 1.64.11 2.4.32 1.84-1.24 2.63-.98 2.63-.98.52 1.31.19 2.28.1 2.52.61.67.98 1.52.98 2.56 0 3.66-2.22 4.46-4.34 4.7.34.29.65.85.65 1.71v2.53c0 .25.17.55.66.46A9.6 9.6 0 0 0 12 2.6Z" /></svg>
  if (name === 'linkedin') return <svg {...common} fill="currentColor" stroke="none"><path d="M5.2 8.4H2.1V22h3.1V8.4ZM3.65 2A1.82 1.82 0 1 0 3.7 5.64 1.82 1.82 0 0 0 3.65 2ZM22 14.2c0-4.1-2.18-6-5.1-6-2.35 0-3.4 1.3-3.99 2.2V8.4H9.8V22h3.1v-6.73c0-1.78.34-3.5 2.55-3.5 2.18 0 2.2 2.04 2.2 3.61V22h3.1v-7.8Z" /></svg>
  if (name === 'email') return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
  return <svg {...common}><path d="M7 17 17 7M8 7h9v9" /><path d="M5 5v14h14" /></svg>
}

/**
 * A fully self-contained, click-only profile control.
 * Pass a partial `profile` object to replace any default content.
 */
export default function InteractiveProfile({ profile = {}, embedded = false, variant = 'premium' }) {
  const data = useMemo(() => {
    const supplied = Object.fromEntries(Object.entries(profile).filter(([, value]) => value !== undefined && value !== null))
    return { ...DEFAULT_PROFILE, ...supplied, links: Array.isArray(supplied.links) ? supplied.links : DEFAULT_PROFILE.links }
  }, [profile])
  const [state, setState] = useState('collapsed')
  const [showContent, setShowContent] = useState(true)
  const [transitioning, setTransitioning] = useState(false)

  function changeState(nextState) {
    if (transitioning || nextState === state) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setTransitioning(true)
    setShowContent(false)
    const revealAfter = reduced ? 0 : 130
    const finishAfter = reduced ? 0 : 620
    window.setTimeout(() => { setState(nextState); setShowContent(true) }, revealAfter)
    window.setTimeout(() => setTransitioning(false), finishAfter)
  }

  const profileImage = (
    <button className="interactive-profile__image-button" onClick={() => state !== 'collapsed' && changeState('collapsed')} aria-label={state === 'collapsed' ? `${data.name}'s profile image` : 'Collapse profile'} type="button">
      <img src={data.image} alt={data.name} className="interactive-profile__image" />
    </button>
  )

  const control = (
    <section className={`interactive-profile interactive-profile--${variant} interactive-profile--${state}${showContent ? ' is-content-visible' : ''}`} aria-label={`${data.name} profile`}>
        {state === 'collapsed' && (
          <div className="interactive-profile__content interactive-profile__collapsed">
            {profileImage}
            <button className="interactive-profile__button interactive-profile__button--green" onClick={() => changeState('profile')} aria-label={`Open ${data.name}'s profile`} type="button"><Icon name="plus" /></button>
          </div>
        )}

        {state === 'profile' && (
          <div className="interactive-profile__content interactive-profile__summary">
            {profileImage}
            <div className="interactive-profile__identity"><p>{data.eyebrow}</p><h1>{data.name}</h1></div>
            <div className="interactive-profile__actions">
              <button className="interactive-profile__button interactive-profile__button--orange" onClick={() => changeState('bio')} aria-label={`Read ${data.name}'s biography`} type="button"><Icon name="bio" /></button>
              <button className="interactive-profile__button interactive-profile__button--blue" onClick={() => changeState('socials')} aria-label={`Open ${data.name}'s social links`} type="button"><Icon name="social" /></button>
            </div>
          </div>
        )}

        {state === 'bio' && (
          <div className="interactive-profile__content interactive-profile__bio" onClick={() => changeState('profile')} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); changeState('profile') } }}>
            <button className="interactive-profile__back" onClick={event => { event.stopPropagation(); changeState('profile') }} aria-label="Back to profile" type="button"><Icon name="back" /></button>
            <div className="interactive-profile__bio-head">{profileImage}<div><p>{data.eyebrow}</p><h1>{data.name}</h1></div></div>
            <p className="interactive-profile__bio-copy">{data.bio}</p>
          </div>
        )}

        {state === 'socials' && (
          <div className="interactive-profile__content interactive-profile__socials">
            <button className="interactive-profile__back" onClick={() => changeState('profile')} aria-label="Back to profile" type="button"><Icon name="back" /></button>
            <div className="interactive-profile__social-list">
              {data.links.map((link, index) => <a key={link.label} className="interactive-profile__social" style={{ '--social-delay': `${index * 55}ms` }} href={link.href} target={link.href.startsWith('mailto:') ? undefined : '_blank'} rel={link.href.startsWith('mailto:') ? undefined : 'noreferrer'} aria-label={link.label}><Icon name={link.icon} /></a>)}
            </div>
          </div>
        )}
    </section>
  )

  return embedded ? control : <main className="interactive-profile-page">{control}</main>
}
