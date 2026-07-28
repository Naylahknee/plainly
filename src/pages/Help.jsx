import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

// ── Goal-based navigation ──────────────────────────────────────────────────────
const GOALS = [
  { id: 'understand',  label: 'I want to understand GitHub' },
  { id: 'save',        label: 'I want to save my project' },
  { id: 'share',       label: 'I want to share my project' },
  { id: 'ai',          label: 'I want to use an AI tool' },
  { id: 'changes',     label: 'I want to see what changed' },
  { id: 'undo',        label: 'I want to undo a mistake' },
  { id: 'publish',     label: 'I want to publish my app' },
  { id: 'link',        label: 'I received a GitHub link' },
]

// ── Plain-language translation table ──────────────────────────────────────────
const TRANSLATIONS = [
  { github: 'Repository',     plain: 'Project',                              meaning: 'The main folder for one project — its files, history, and settings.',                now: false },
  { github: 'Commit',         plain: 'A saved checkpoint',                   meaning: 'A snapshot of the project at one moment in time.',                                   now: true  },
  { github: 'Commit message', plain: 'A note explaining what changed',       meaning: 'The label you write when saving — describes what you did.',                          now: true  },
  { github: 'Push',           plain: 'Send saved work to GitHub',            meaning: 'Upload your saved changes so they are stored online.',                               now: true  },
  { github: 'Pull',           plain: 'Get the newest version',               meaning: 'Download the latest changes from GitHub to your current view.',                      now: false },
  { github: 'Branch',         plain: 'A separate version',                   meaning: 'A copy of the project where changes can be tested without affecting the main work.', now: false },
  { github: 'Merge',          plain: 'Combine one version with another',     meaning: 'Bring changes from one version into the main project.',                              now: false },
  { github: 'Pull request',   plain: 'Ask to review and combine changes',    meaning: 'A formal way to propose that someone review and accept a set of changes.',           now: false },
  { github: 'Clone',          plain: 'Copy a project onto a computer',       meaning: 'Download the full project to work on it locally.',                                   now: false },
  { github: 'Fork',           plain: 'Your own copy of someone else\'s project', meaning: 'Create a personal copy of a project you do not own.',                           now: false },
  { github: 'Issue',          plain: 'A task, problem, or request',          meaning: 'A way to track work that needs to be done.',                                        now: false },
  { github: 'README',         plain: 'The project\'s introduction',          meaning: 'A file that explains what the project is and how to use it.',                       now: false },
  { github: 'Deploy',         plain: 'Publish the project',                  meaning: 'Make the project live so other people can use it.',                                  now: false },
  { github: 'Star',           plain: 'Bookmark or favourite',                meaning: 'Save a project you like — it does not give you access or copy anything.',           now: false },
  { github: 'Watch',          plain: 'Follow activity from a project',       meaning: 'Receive notifications when something changes in the project.',                       now: false },
]

// ── Walkthroughs ──────────────────────────────────────────────────────────────
const WALKTHROUGHS = [
  {
    id: 'save-ai-work',
    title: 'I built something with an AI and need to save it',
    steps: [
      'Connect GitHub',
      'Choose or create a project',
      'Add the project files',
      'Review what will be saved',
      'Create a Save Point',
      'Confirm it saved to GitHub',
    ],
  },
  {
    id: 'invite-collaborator',
    title: 'I want another person to help',
    steps: [
      'Open Project Settings',
      'Choose Sharing',
      'Invite collaborator by GitHub username or email',
      'Select an access level',
      'Send the invitation',
    ],
  },
  {
    id: 'handoff-ai',
    title: 'I want to give Claude, Bob, or another AI my project',
    steps: [
      'Open the project in Plainly',
      'Click Continue with Another AI',
      'Select the AI tool',
      'Review the included context',
      'Copy or open the handoff',
    ],
  },
  {
    id: 'undo-mistake',
    title: 'I think I broke something',
    steps: [
      'Open the file',
      'Click History',
      'Find an earlier version',
      'Click Compare to see what changed',
      'Click Restore to go back to that version',
    ],
  },
]

// ── Roles / access levels ─────────────────────────────────────────────────────
const ROLES = [
  { level: 'View',       meaning: 'Can read the project' },
  { level: 'Contribute', meaning: 'Can suggest or make changes' },
  { level: 'Manage',     meaning: 'Can control most project settings' },
  { level: 'Owner',      meaning: 'Has full control' },
]

// ── Goal-specific content ─────────────────────────────────────────────────────
const GOAL_CONTENT = {
  understand: {
    heading: 'What GitHub is actually for',
    body: (
      <>
        <p className="help-lead">
          GitHub is where your project is stored, protected, and tracked over time.
          It lets you keep a safe history of your work, return to earlier versions,
          share the project with others, and connect it to tools that help build or
          publish it.
        </p>
        <div className="help-reasons">
          {[
            { title: 'Keep your project safe',          desc: 'Your project is stored online instead of living only on one computer.' },
            { title: 'Track every important change',    desc: 'GitHub keeps a history so you can see what changed and restore an earlier version.' },
            { title: 'Work with other people or AI',    desc: 'You can share access without emailing files back and forth.' },
            { title: 'Publish or connect your project', desc: 'Hosting services, coding tools, and AI builders can use the project stored in GitHub.' },
          ].map(r => (
            <div key={r.title} className="help-reason-card">
              <strong>{r.title}</strong>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
        <div className="help-callout">
          <p className="help-callout-label">The five things beginners need to know</p>
          <ol className="help-five">
            <li>Your project is stored in a repository — Plainly calls it a <strong>Project</strong>.</li>
            <li>GitHub keeps a history of every change you save.</li>
            <li>A saved change is called a <strong>commit</strong> — Plainly calls it a <strong>Save Point</strong>.</li>
            <li>Private projects are not visible to anyone you have not invited.</li>
            <li>You can always open GitHub directly for advanced controls.</li>
          </ol>
          <p className="help-callout-foot">
            You can build and manage a basic project without learning every GitHub feature.
          </p>
        </div>
      </>
    ),
  },
  save: {
    heading: 'Saving your project',
    body: (
      <>
        <p className="help-lead">
          Every time you want to keep a version of your work, create a Save Point.
          Plainly saves it to GitHub automatically — you do not need to push, commit,
          or use a terminal.
        </p>
        <div className="help-walkthrough">
          {WALKTHROUGHS.find(w => w.id === 'save-ai-work').steps.map((s, i) => (
            <div key={i} className="help-walk-step">
              <div className="help-walk-num">{i + 1}</div>
              <p>{s}</p>
            </div>
          ))}
        </div>
        <div className="help-callout">
          <p>
            <strong>How often should I save?</strong> Save whenever you reach a point
            you might want to come back to — after finishing a section, before trying
            something risky, or at the end of a working session.
          </p>
        </div>
      </>
    ),
  },
  share: {
    heading: 'Sharing your project',
    body: (
      <>
        <p className="help-lead">
          Sharing a project on GitHub can mean several different things. It is worth
          understanding which kind you need.
        </p>
        <div className="help-share-types">
          <div className="help-share-block">
            <h4>Send someone a link</h4>
            <p>They can view the project only if it is public, or if they already have access.</p>
          </div>
          <div className="help-share-block">
            <h4>Invite a collaborator</h4>
            <p>They can work directly in the project according to the access level you choose.</p>
            <table className="help-roles-table">
              <thead><tr><th>Access</th><th>What it means</th></tr></thead>
              <tbody>{ROLES.map(r => (
                <tr key={r.level}><td>{r.level}</td><td>{r.meaning}</td></tr>
              ))}</tbody>
            </table>
            <p className="help-safety-note">
              Only give edit access to people you trust. You can remove access at any time.
            </p>
          </div>
          <div className="help-share-block">
            <h4>Share with an AI tool</h4>
            <p>
              AI tools may need a GitHub connection, a project link, selected files,
              or a prompt containing project context. Plainly helps you prepare that
              context so you do not have to figure out which files or technical
              instructions the AI needs.
            </p>
          </div>
        </div>
        <div className="help-section-block">
          <h4>Public vs private</h4>
          <div className="help-visibility-cards">
            <div className="help-vis-card">
              <span className="help-vis-label private">Private</span>
              <p>Only you and people you invite can view it. Use this for unfinished work,
              personal projects, private information, or projects containing business ideas.</p>
            </div>
            <div className="help-vis-card">
              <span className="help-vis-label public">Public</span>
              <p>Anyone can view the project files. Use this when you intentionally want
              others to see the work, it is open-source, or you are sharing a portfolio.</p>
            </div>
          </div>
          <div className="help-callout">
            <p>
              <strong>Important:</strong> Public does not mean people can automatically
              change your project. It means they can view it and may be able to copy it.
            </p>
          </div>
        </div>
      </>
    ),
  },
  ai: {
    heading: 'Using an AI tool with your project',
    body: (
      <>
        <p className="help-lead">
          Plainly prepares your entire project context — not just a single file — so
          any AI tool can pick up exactly where you left off.
        </p>
        <div className="help-walkthrough">
          {WALKTHROUGHS.find(w => w.id === 'handoff-ai').steps.map((s, i) => (
            <div key={i} className="help-walk-step">
              <div className="help-walk-num">{i + 1}</div>
              <p>{s}</p>
            </div>
          ))}
        </div>
        <div className="help-callout">
          <p>
            <strong>What is included in the handoff?</strong> Plainly bundles the
            project name, description, file list, contents of your open file, your
            most recent save point, and any instruction you add. The AI receives
            everything it needs without you having to explain it from scratch.
          </p>
        </div>
        <div className="help-section-block">
          <h4>Why use Plainly for AI handoffs?</h4>
          <p>
            Each AI tool only knows what happened inside its own conversation. Plainly
            is the one place that holds the full story: what you asked each AI to do,
            which files changed, and what is still unfinished. That means you can switch
            between Claude, ChatGPT, Gemini, or Bob without losing context.
          </p>
        </div>
      </>
    ),
  },
  changes: {
    heading: 'Seeing what changed',
    body: (
      <>
        <p className="help-lead">
          Every Save Point records a snapshot of your file at that moment. You can
          compare any two versions to see exactly what was added or removed.
        </p>
        <div className="help-steps-inline">
          {['Open the file', 'Click History', 'Choose a past save point', 'Click Compare to see what changed'].map((s, i) => (
            <div key={i} className="help-walk-step">
              <div className="help-walk-num">{i + 1}</div>
              <p>{s}</p>
            </div>
          ))}
        </div>
        <div className="help-callout">
          <p>
            Added content is shown in green. Removed content is shown in red.
            Lines that did not change are shown in grey.
          </p>
        </div>
        <div className="help-section-block">
          <h4>Project Timeline</h4>
          <p>
            Open any project and click <strong>Timeline</strong> in the top bar to see
            the full story of that project: every save point across all files, AI
            handoffs you made, and tasks you created — in chronological order.
          </p>
        </div>
      </>
    ),
  },
  undo: {
    heading: 'Undoing a mistake',
    body: (
      <>
        <p className="help-lead">
          As long as you created a Save Point before the mistake, you can go back.
          Restoring never permanently deletes anything — it creates a new save point
          with the older content.
        </p>
        <div className="help-walkthrough">
          {WALKTHROUGHS.find(w => w.id === 'undo-mistake').steps.map((s, i) => (
            <div key={i} className="help-walk-step">
              <div className="help-walk-num">{i + 1}</div>
              <p>{s}</p>
            </div>
          ))}
        </div>
        <div className="help-callout">
          <p>
            <strong>What if I did not create a Save Point?</strong> If auto-save ran
            in the last 30 seconds, your work is still there. If no save was ever
            created, the previous version is not recoverable through Plainly. This
            is why saving regularly matters.
          </p>
        </div>
      </>
    ),
  },
  publish: {
    heading: 'Publishing your project',
    body: (
      <>
        <p className="help-lead">
          Deploying means making your project available online so other people can use
          it. GitHub integrates with many hosting services that can do this automatically
          whenever you save a new version.
        </p>
        <div className="help-callout">
          <p>
            <strong>Coming to Plainly.</strong> Direct publish support is on the roadmap.
            For now, you can connect your GitHub project to Vercel, Netlify, Cloudflare
            Pages, or GitHub Pages from those services' dashboards — point them at your
            GitHub repository and they will build and publish it automatically.
          </p>
        </div>
        <div className="help-section-block">
          <h4>The basic concept</h4>
          <p>
            When you create a Save Point in Plainly, the change is stored in GitHub.
            If a hosting service is connected, it detects that change and rebuilds
            your published site within a minute or two. You do not need to do anything
            extra — saving in Plainly is the same as publishing.
          </p>
        </div>
      </>
    ),
  },
  link: {
    heading: 'You received a GitHub link',
    body: (
      <>
        <p className="help-lead">
          GitHub links can point to many different things. Here is how to read them.
        </p>
        <div className="help-link-types">
          {[
            { pattern: 'github.com/username/project-name', what: 'A project (repository). You can view it if it is public or if you have been invited.', action: 'Open it in Plainly to read and edit, or view it directly on GitHub.' },
            { pattern: 'github.com/username/project-name/issues/123', what: 'A task or problem that someone filed.', action: 'Read the discussion and add a comment if you have access.' },
            { pattern: 'github.com/username/project-name/pull/45', what: 'A proposed set of changes waiting for review.', action: 'Review the changes and approve or comment.' },
            { pattern: 'github.com/username/project-name/tree/branch-name', what: 'A specific separate version (branch) of the project.', action: 'You are looking at a version that may be different from the main project.' },
          ].map(t => (
            <div key={t.pattern} className="help-link-card">
              <code className="help-link-pattern">{t.pattern}</code>
              <p className="help-link-what">{t.what}</p>
              <p className="help-link-action"><strong>What to do:</strong> {t.action}</p>
            </div>
          ))}
        </div>
        <div className="help-callout">
          <p>
            If you are unsure what a link points to, you can open it in your browser.
            GitHub will show you what it is. You cannot break anything by looking.
          </p>
        </div>
      </>
    ),
  },
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Help({ auth }) {
  const location = useLocation()
  const isSignedIn = !!auth?.token

  if (isSignedIn) {
    return (
      <div className="projects-page">
        <nav className="app-nav">
          <Link to="/" className="app-nav-logo">plainly</Link>
          <div className="app-nav-links">
            <Link to="/" className={`app-nav-link${location.pathname === '/' ? ' active' : ''}`}>
              Projects
            </Link>
            <Link to="/help" className={`app-nav-link${location.pathname === '/help' ? ' active' : ''}`}>
              Help
            </Link>
          </div>
          <div className="app-nav-footer">
            {auth.user?.avatar_url && (
              <img className="app-nav-avatar" src={auth.user.avatar_url} alt={auth.user.login} />
            )}
            <span className="app-nav-username">{auth.user?.login}</span>
            <button className="app-nav-signout" onClick={auth.signOut}>Sign out</button>
          </div>
        </nav>
        <div className="app-main">
          <HelpContent />
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link to="/" className="back-btn">
          <span aria-hidden="true">←</span> Home
        </Link>
        <div className="topbar-title">Help</div>
        <div className="topbar-actions" />
      </header>
      <HelpContent />
    </div>
  )
}

// ── Help content — shared between signed-in and signed-out layouts ─────────────
function HelpContent() {
  const [activeGoal, setActiveGoal] = useState(null)
  const [openTerm, setOpenTerm]     = useState(null)

  const goalContent = activeGoal ? GOAL_CONTENT[activeGoal] : null

  return (
    <main className="help-main">

      {/* ── Section 1: Start here ── */}
      <section className="help-section">
        <h2 className="help-section-title">Start here</h2>
        <p className="help-lead">
          GitHub is where your project is stored, protected, and tracked over time.
          Plainly gives you access to everything GitHub can do — in plain language,
          without requiring you to learn developer tools.
        </p>
        <div className="help-callout">
          <p className="help-callout-label">The five things beginners need to know</p>
          <ol className="help-five">
            <li>Your project is stored in a repository — Plainly calls it a <strong>Project</strong>.</li>
            <li>GitHub keeps a history of every change you save.</li>
            <li>A saved change is called a <strong>commit</strong> — Plainly calls it a <strong>Save Point</strong>.</li>
            <li>Private projects are not visible to anyone you have not invited.</li>
            <li>You can always open GitHub directly for advanced controls.</li>
          </ol>
          <p className="help-callout-foot">
            You can build and manage a basic project without learning every GitHub feature.
          </p>
        </div>
      </section>

      {/* ── Section 2: Goal-based nav ── */}
      <section className="help-section">
        <h2 className="help-section-title">What are you trying to do?</h2>
        <div className="help-goal-grid">
          {GOALS.map(g => (
            <button
              key={g.id}
              className={`help-goal-btn${activeGoal === g.id ? ' active' : ''}`}
              onClick={() => setActiveGoal(activeGoal === g.id ? null : g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>

        {goalContent && (
          <div className="help-goal-content">
            <h3 className="help-goal-heading">{goalContent.heading}</h3>
            {goalContent.body}
          </div>
        )}
      </section>

      {/* ── Section 3: Translation table ── */}
      <section className="help-section">
        <h2 className="help-section-title">GitHub translated</h2>
        <p className="help-section-intro">
          Every GitHub term below has a plain-language equivalent. Click any row to see
          whether you need it right now.
        </p>
        <div className="help-translation-list">
          {TRANSLATIONS.map(t => (
            <div
              key={t.github}
              className={`help-translation-row${openTerm === t.github ? ' open' : ''}`}
            >
              <button
                className="help-translation-trigger"
                onClick={() => setOpenTerm(openTerm === t.github ? null : t.github)}
              >
                <span className="help-github-term">{t.github}</span>
                <span className="help-arrow" aria-hidden="true">→</span>
                <span className="help-plain-term">{t.plain}</span>
                <span className="help-expand-icon" aria-hidden="true">
                  {openTerm === t.github ? '▲' : '▼'}
                </span>
              </button>
              {openTerm === t.github && (
                <div className="help-translation-detail">
                  <p>{t.meaning}</p>
                  <p className={`help-need-now ${t.now ? 'yes' : 'no'}`}>
                    <strong>Do I need this right now?</strong>{' '}
                    {t.now
                      ? 'Yes — this is part of the core Plainly workflow.'
                      : 'Probably not yet. You can use Plainly fully without this for now.'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Walkthroughs ── */}
      <section className="help-section">
        <h2 className="help-section-title">Show me how</h2>
        <div className="help-walkthroughs">
          {WALKTHROUGHS.map(w => (
            <div key={w.id} className="help-walkthrough-block">
              <h4 className="help-walk-title">{w.title}</h4>
              <div className="help-walkthrough">
                {w.steps.map((s, i) => (
                  <div key={i} className="help-walk-step">
                    <div className="help-walk-num">{i + 1}</div>
                    <p>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}
