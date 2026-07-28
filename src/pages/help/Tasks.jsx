/**
 * help/Tasks.jsx — /help/tasks
 *
 * "What are you trying to do?" — the eight things people arrive wanting, each
 * opening the full answer below the grid. ?goal=id opens one directly;
 * ?walk=id scrolls the step-by-steps into view.
 */

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GOALS, WALKTHROUGHS } from '../../help/content'
import GoalContent from '../../help/GoalContent'

export default function Tasks() {
  const [params, setParams] = useSearchParams()
  const goal = params.get('goal')
  const walk = params.get('walk')
  const answerRef = useRef(null)
  const walkRef = useRef(null)

  const active = GOALS.some(g => g.id === goal) ? goal : null

  const select = id => {
    const next = new URLSearchParams(params)
    if (id === active) next.delete('goal')
    else next.set('goal', id)
    setParams(next, { replace: true })
  }

  // Landing here from a search result should show the thing you searched for.
  useEffect(() => {
    const target = walk ? walkRef.current : active ? answerRef.current : null
    if (target) target.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [active, walk])

  return (
    <>
      <section className="help-section">
        <h2 className="help-section-title">What are you trying to do?</h2>
        <p className="help-section-intro">
          Pick the closest one. The answer opens underneath.
        </p>

        <div className="help-task-grid">
          {GOALS.map(g => (
            <button
              key={g.id}
              className={`help-task-card${active === g.id ? ' help-task-card--on' : ''}`}
              onClick={() => select(g.id)}
              aria-expanded={active === g.id}
            >
              <span className="help-task-label">{g.label}</span>
              <span className="help-task-summary">{g.summary}</span>
            </button>
          ))}
        </div>

        <div ref={answerRef}>
          {active && <GoalContent id={active} />}
        </div>
      </section>

      <section className="help-section" ref={walkRef}>
        <h2 className="help-section-title">Step by step</h2>
        <p className="help-section-intro">
          The same journeys, written out in order, so you can follow along with the app open.
        </p>
        <div className="help-walkthroughs">
          {WALKTHROUGHS.map(w => (
            <div
              key={w.id}
              className={`help-walkthrough-block${walk === w.id ? ' help-walkthrough-block--on' : ''}`}
            >
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
    </>
  )
}
