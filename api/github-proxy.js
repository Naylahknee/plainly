// Vercel's file-system catch-all only resolved the first segment of this
// proxy path in this deployment. The explicit rewrite in vercel.json sends
// all GitHub API paths here; the shared handler validates and forwards them.
export { default } from './github/[...path].js'
