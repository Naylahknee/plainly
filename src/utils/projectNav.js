/**
 * projectNav.js — the sections a project has, defined once.
 *
 * The sidebar shows these on a desktop. On a phone the sidebar is gone and
 * Project Home shows the same list as a card, so this is deliberately the only
 * place the list exists — writing it out twice is exactly how the "Continue
 * with AI" link drifted out of step with the sidebar and shipped broken.
 */

import { aiRouteFor } from './aiRoute'

export function projectNavItems(owner, repo, activeUpdate) {
  const at = page => `/p/${owner}/${repo}${page ? `/${page}` : ''}`
  return [
    { to: at(),            label: 'Project Home',     end: true },
    { to: at('updates'),   label: 'Updates' },
    { to: at('todo'),      label: 'Things to Do' },
    { to: at('new-update'),label: 'Make an Update' },
    { to: at('files'),     label: 'Project Files' },
    { to: at('changed'),   label: 'What Changed' },
    { to: at('points'),    label: 'Save Points' },
    { to: at('versions'),  label: 'Separate Versions' },
    { to: at('publish'),   label: 'Put It on the Web' },
    { to: at('share'),     label: 'Who Can See It' },
    { to: aiRouteFor(owner, repo, activeUpdate),
                           label: 'Continue with AI' },
    { to: at('settings'),  label: 'Settings' },
  ]
}
