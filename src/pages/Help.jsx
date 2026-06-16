import { Link } from 'react-router-dom'

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Sign in with GitHub',
    body: 'plainly uses GitHub to store your files. Your GitHub account is your login — no new password needed.'
  },
  {
    step: '2',
    title: 'See your projects',
    body: 'Each project is a folder that holds related files. Create as many as you need — one per book, topic, or job.'
  },
  {
    step: '3',
    title: 'Open a file and write',
    body: 'Pick any file to open it in the editor. plainly hides all the developer features so you see just the text.'
  },
  {
    step: '4',
    title: 'Make a save point',
    body: 'When you want to keep a version, click "Save point". You can add a label like "finished the intro". That version is kept forever and you can always go back.'
  },
]

const GLOSSARY = [
  {
    term: 'Project',
    definition: 'A place to keep all the files that belong together — like one book, one class, or one job.',
    example: 'Example: "My Novel" is a project that holds chapter-1.txt, chapter-2.txt, and notes.md.'
  },
  {
    term: 'File',
    definition: 'A single document inside a project. You write in it, and plainly keeps a copy of every version.',
    example: 'Example: chapter-1.txt, meeting-notes.md, or ideas.txt.'
  },
  {
    term: 'Save point',
    definition: 'A snapshot of your file at a moment in time. Like pressing pause — you can always come back to it.',
    example: 'Example: You finish a draft and click "Save point". Two days later you can restore that exact version.'
  },
  {
    term: 'History',
    definition: 'The full list of every save point you\'ve made for a file, from newest to oldest.',
    example: 'Example: Click "History" on any file to see every version, with dates and your own labels.'
  },
  {
    term: 'Go back to this version',
    definition: 'Restore a file to exactly how it looked at a past save point, without permanently losing anything newer.',
    example: 'Example: You deleted a paragraph by accident yesterday. Find yesterday\'s save point and restore it.'
  },
]

export default function Help({ auth }) {
  const backLabel = auth?.token ? 'Projects' : 'Home'

  return (
    <div className="page">
      <header className="topbar">
        <Link to="/" className="back-btn">
          <span aria-hidden="true">←</span> {backLabel}
        </Link>
        <div className="topbar-title">How plainly works</div>
        <div className="topbar-actions" />
      </header>

      <main className="help-main">
        <section className="help-section">
          <h2 className="help-section-title">How it works</h2>
          <div className="how-steps">
            {HOW_IT_WORKS.map(({ step, title, body }) => (
              <div key={step} className="how-step">
                <div className="how-step-num">{step}</div>
                <div className="how-step-content">
                  <h3 className="how-step-title">{title}</h3>
                  <p className="how-step-body">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="help-section">
          <h2 className="help-section-title">Plain-English glossary</h2>
          <div className="glossary">
            {GLOSSARY.map(({ term, definition, example }) => (
              <div key={term} className="glossary-card">
                <h3 className="glossary-term">{term}</h3>
                <p className="glossary-def">{definition}</p>
                <p className="glossary-example">{example}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
