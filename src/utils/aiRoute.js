/**
 * aiRoute.js — where "Continue with AI" goes.
 *
 * One rule, one place. It was written out twice — in the sidebar and on
 * Project Home — and when the project-level screen at /p/:repo/ai was added,
 * only the sidebar was updated. The card on Project Home kept sending people
 * to the Updates list, which looks exactly like the screen failing to open.
 *
 * Anything that offers "Continue with AI" outside an update calls this.
 */

export function aiRouteFor(repo, activeUpdate) {
  return activeUpdate
    ? `/p/${repo}/u/${activeUpdate.id}/ai`   // the update in progress
    : `/p/${repo}/ai`                        // the project itself
}
