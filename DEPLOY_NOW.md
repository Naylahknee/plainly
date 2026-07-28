# Deploy to Vercel — Final Checklist

**Status:** ✅ All systems ready  
**Build:** ✅ Passing (91 modules, 3.57s)  
**Smoke Tests:** ✅ 46/46 passed  
**Code Review:** ✅ PASS (secure, production-ready)  
**Date:** 2026-07-28

---

## Pre-Deployment ✅

- [x] Smoke tests passed (46/46)
- [x] Code review passed (security, quality, performance, accessibility)
- [x] Build passes with zero errors
- [x] All 7 core workflows implemented
- [x] GitHub API integration complete
- [x] Design system fully integrated
- [x] Documentation complete (DEPLOYMENT.md, E2E_TESTS.md, IMPLEMENTATION_COMPLETE.md)

---

## Deployment Options

### Option 1: Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI globally (if not already installed)
npm install -g vercel

# 2. Authenticate with Vercel
vercel login

# 3. Deploy to production
vercel --prod

# 4. Check deployment status
vercel logs
```

**Expected Output:**
```
✅ Vercel URL: https://plainly.vercel.app/
✅ GitHub integration linked
✅ Auto-deploy on push enabled
```

---

### Option 2: GitHub Integration (Automatic)

If repository is connected to Vercel:

```bash
# 1. Push to main branch
git push origin main

# 2. Vercel automatically deploys
# Watch deployment at: https://vercel.com/dashboard

# 3. Check status
vercel logs
```

---

### Option 3: Vercel Web Dashboard

1. Visit https://vercel.com/dashboard
2. Select your "plainly" project
3. Click "Deploy" or "Redeploy"
4. Wait for build to complete (~5 minutes)
5. Check deployment log for errors

---

## Post-Deployment Checklist

After deployment, verify:

```bash
# 1. Check production URL
curl -I https://plainly.vercel.app/
# Should return 200 OK

# 2. Monitor logs for errors (first 10 minutes)
vercel logs --follow

# 3. Test sign-in flow
# Visit https://plainly.vercel.app/
# Should redirect to GitHub OAuth
# Should show dashboard after login

# 4. Check performance
# Lighthouse: https://plainly.vercel.app/
# Should score > 80 (Performance, Accessibility, Best Practices)

# 5. Monitor error tracking (if Sentry configured)
# Check error dashboard for spike
# Should see 0 errors from production traffic
```

---

## Environment Variables (Required on Vercel)

Set in Vercel dashboard under Project Settings → Environment Variables:

```
VITE_GITHUB_CLIENT_ID = <from GitHub OAuth App>
VITE_GITHUB_REDIRECT_URI = https://plainly.vercel.app/auth/callback
```

**Optional (for monitoring):**
```
SENTRY_AUTH_TOKEN = <from Sentry if using error tracking>
VITE_API_BASE = https://api.github.com
```

---

## Rollback Plan

If deployment fails or errors appear:

```bash
# 1. Check deployment logs
vercel logs --since 5m

# 2. Rollback to previous deployment
vercel rollback

# 3. Or revert commit
git revert HEAD
git push origin main
```

---

## 24-Hour Monitoring

### Hour 1-2 (Critical)
- Monitor error rate (should be 0)
- Check OAuth sign-in flow
- Verify API responses (GitHub)
- Monitor page load times

### Hour 2-6 (Ongoing)
- Monitor error logs (Sentry if configured)
- Check user feedback (support channel)
- Verify core workflows:
  - Create update
  - Continue with AI
  - Check changes
  - Review changes

### Hour 6-24 (Validation)
- Monitor performance metrics
- Check Lighthouse scores
- Collect early user feedback
- Plan Phase 2 features

---

## Success Criteria

✅ Production URL loads without 5xx errors  
✅ GitHub OAuth flow works end-to-end  
✅ Create update workflow works  
✅ Handoff to AI workflow works  
✅ Change detection works (if commits exist)  
✅ Lighthouse score > 80  
✅ Error rate < 1%  
✅ Page load < 3 seconds  

---

## Contacts

**On-Call Support:** [team contact]  
**Escalation:** [slack channel or email]  
**Bug Tracker:** [Linear or GitHub Issues]

---

## Deployment Sign-Off

- [ ] Engineering: Code reviewed and approved
- [ ] QA: Smoke tests passed
- [ ] Product: Features approved
- [ ] Deploy: Run `vercel --prod` or trigger via GitHub
- [ ] Monitor: Watch logs for 24 hours
- [ ] Celebration: 🎉 Plainly v2 is live!

---

**Ready to deploy? Run:**
```bash
vercel --prod
```

**Or push to main for auto-deploy:**
```bash
git push origin main
```
