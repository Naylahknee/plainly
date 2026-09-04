/**
 * heroFor.js
 *
 * Single source of truth for the four hero fields displayed on:
 *   - Home dashboard continue-card
 *   - Project Home hero
 *   - Update workspace hero
 *
 * Every screen imports this function. No screen computes these strings itself.
 * The strings are the product — do not paraphrase them.
 *
 * @param {object} update  — an update record from updateMemory
 * @param {object} ctx     — { filesCount: number, activity: string }
 *   filesCount — number of files this update touches (update.files.length)
 *   activity   — human-readable time of last activity, e.g. "Today at 4:22 PM" or "3 hours ago"
 * @returns {{ left: string, since: string, next: string, cta: string, route: string }}
 */
export function heroFor(update, { filesCount = 0, activity = 'recently' } = {}) {
  const files = filesCount === 1 ? '1 file' : `${filesCount} files`
  const ai = update.ai || 'AI'

  switch (update.status) {
    case 'saved':
      return {
        left:  'You finished this update and saved it to GitHub.',
        since: `Saved to GitHub ${activity}${update.savePoint ? ` as Save Point ${update.savePoint}` : ''} — ${files}, nothing outstanding.`,
        next:  "Nothing left to do on this one. Pick another update when you're ready.",
        cta:   'See what changed',
        route: 'changed',
      }

    case 'planned':
      return {
        left:  "You described this update and haven't started it yet.",
        since: `Nothing yet — nobody has worked on this. Last touched ${activity}.`,
        next:  'Hand it to an AI, or start editing yourself.',
        cta:   'Start this update',
        route: 'ai',
      }

    case 'ready_for_ai':
      return {
        left:  'This update is ready to be handed to an AI.',
        since: `Prepared ${activity} — not sent yet.`,
        next:  'Choose an AI and send it the context.',
        cta:   'Continue in…',
        route: 'ai',
      }

    case 'sent_to_ai':
      return {
        left:  `You handed this update to ${ai} and marked it as sent.`,
        since: `Nothing has changed in GitHub since you sent it — last activity ${activity}.`,
        next:  `Check whether ${ai} has saved any work yet.`,
        cta:   'Check for changes',
        route: 'return',
      }

    case 'changes_detected':
    case 'waiting_for_review':
      return {
        left:  `You handed this update to ${ai} and marked it as sent.`,
        since: `${files} changed in GitHub — last activity ${activity}. Nobody has read through those changes or made a Save Point for them yet.`,
        next:  'Read what changed before anything is saved.',
        cta:   'Review the changes',
        route: 'review',
      }

    case 'ready_to_save':
      return {
        left:  update.ai === 'You' || !update.ai
          ? 'You were editing this yourself — no AI involved.'
          : `You reviewed what ${ai} changed and accepted it.`,
        since: `${files} edited and reviewed — last activity ${activity}. Not in GitHub yet.`,
        next:  "Save it to GitHub so it's backed up.",
        cta:   'Review and save',
        route: 'save',
      }

    case 'needs_correction':
      return {
        left:  `${ai} made changes but something was not right.`,
        since: `Marked as needing correction ${activity}.`,
        next:  `Ask ${ai} to fix what it got wrong.`,
        cta:   'Continue in…',
        route: 'ai',
      }

    case 'paused':
      return {
        left:  "You paused this update.",
        since: `Paused ${activity}.`,
        next:  "Pick this back up when you're ready.",
        cta:   'Continue this update',
        route: 'ai',
      }

    default:
      return {
        left:  'This update is in progress.',
        since: `Last activity ${activity}.`,
        next:  'Continue working on it.',
        cta:   'Continue this update',
        route: 'ai',
      }
  }
}

/**
 * Compute the single recommended next action for an entire project.
 * Evaluates rules in order and stops at the first match.
 * Never returns more than one recommendation.
 *
 * @param {object} ctx
 *   ctx.tokenExpired   — boolean: GitHub token is expired (401)
 *   ctx.remoteAhead    — boolean: GitHub is ahead of last seen SHA and user has local edits
 *   ctx.activeUpdate   — update object or null
 *   ctx.hasLocalEdits  — boolean: unsaved changes in the editor
 * @returns {{ text: string, cta: string, route: string }}
 */
export function projectNextAction({
  tokenExpired   = false,
  remoteAhead    = false,
  activeUpdate   = null,
  hasLocalEdits  = false,
} = {}) {
  if (tokenExpired) {
    return {
      text:  'Sign in again to keep working.',
      cta:   'Reconnect',
      route: '/account',
    }
  }

  if (remoteAhead) {
    return {
      text:  'Get the latest version before you edit — GitHub is ahead of this computer.',
      cta:   'Get latest version',
      route: 'pull',
    }
  }

  if (activeUpdate) {
    const status = activeUpdate.status
    if (status === 'changes_detected' || status === 'waiting_for_review') {
      return {
        text:  'Read what changed before anything is saved.',
        cta:   'Review the changes',
        route: `review`,
      }
    }
    if (hasLocalEdits) {
      return {
        text:  "Review and save your changes so they're safe in GitHub.",
        cta:   'Review and save',
        route: `save`,
      }
    }
    if (status === 'sent_to_ai') {
      return {
        text:  `Check whether ${activeUpdate.ai || 'the AI'} has saved any work yet.`,
        cta:   'Check for changes',
        route: `return`,
      }
    }
    if (status === 'planned' || status === 'ready_for_ai') {
      return {
        text:  'Hand it to an AI, or start editing yourself.',
        cta:   'Start this update',
        route: `ai`,
      }
    }
    if (status === 'ready_to_save') {
      return {
        text:  "Save it to GitHub so it's backed up.",
        cta:   'Review and save',
        route: `save`,
      }
    }
  }

  if (hasLocalEdits) {
    return {
      text:  "Review and save your changes so they're safe in GitHub.",
      cta:   'Review and save',
      route: 'save',
    }
  }

  return {
    text:  'Describe what you want to change next.',
    cta:   'Make an update',
    route: 'new-update',
  }
}
