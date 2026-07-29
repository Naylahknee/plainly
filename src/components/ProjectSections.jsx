/**
 * ProjectSections.jsx — a project's sections as a grouped card.
 *
 * Only appears on phones, where there is no sidebar to hold them. Same list,
 * from projectNavItems(), so the two can't disagree.
 *
 * The shape is the one people already know from their phone: a white rounded
 * card, rows separated by hairlines, a chevron on each. One line per row —
 * a description under every item is what makes a list like this feel heavy,
 * and these labels are already the plain-English names.
 *
 * Project Home is left out — you're already on it.
 */

import { Link } from 'react-router-dom'
import { projectNavItems } from '../utils/projectNav'

export default function ProjectSections({ owner, repo, activeUpdate }) {
  const items = projectNavItems(owner, repo, activeUpdate).filter(i => !i.end)

  return (
    <section className="sections" aria-label="Everything in this project">
      <div className="section-label">Everything in this project</div>
      <div className="card-list">
        {items.map(item => (
          <Link key={item.to} to={item.to} className="card-row">
            <span className="card-row-title">{item.label}</span>
            <span className="card-row-chevron" aria-hidden="true">›</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
