# Final pre-launch security and reliability review

## 1. Apply the approved migration (only change)
- Re-check that no existing records are linked across accounts (read-only query).
- Apply the exact ownership-check migration already shown, for the four links: follow-ups to applications, vacancies to applications, learning goals to skills, planner check-offs to tasks. Nothing else changes.

## 2. Verify it works
- On your account, using clearly fictional records: create an application with a follow-up, a skill with a learning goal, and a task with a check-off, and link a vacancy to an application. All should save.
- Try linking to made-up record IDs that don't belong to you. Each should be refused.
- Remove only the fictional records afterwards. Your real data is not touched.
- Run the existing test suite once and report the exact results. Tests that already passed are not repeated in the browser.

## 3. Safe checks only (read-only)
- Run the quick security scan and the database linter once.
- Read-only review of: the four sign-up setup step warnings, leaked-password protection status, the six package advisories, and the settings file in Git.
- No new test accounts are created.

## 4. Final report
- Changes completed, test results, remaining risks (privacy, CV, AI, account isolation), items still needing approval, and a publish-readiness verdict.

## Still needs separate approval (not done in this plan)
- Locking down the four sign-up setup steps
- Turning on leaked-password checking
- The four same-version package updates
- Keeping the settings file out of Git
- A true two-account test

Nothing is published, and authentication, storage, other access rules and GitHub stay unchanged.
