# Contributing to Hyper Learning Tech

First off, thank you for considering contributing to **Hyper Learning Tech**!

We welcome contributions that improve the platform, fix bugs, enhance performance, improve documentation, or introduce new features while maintaining our production-quality standards.

Please read this guide before opening an Issue or Pull Request.

---

# Table of Contents

- Code of Conduct
- Development Workflow
- Project Setup
- Branch Strategy
- Coding Standards
- Formatting & Quality Checks
- Commit Message Convention
- Pull Request Process
- Code Review
- Reporting Bugs
- Suggesting Features

---

# Code of Conduct

By participating in this project, you agree to follow our Code of Conduct.

Please be respectful, constructive, and collaborative.

---

# Before You Start

Before writing any code:

- Search existing Issues and Pull Requests.
- Discuss major changes before implementation.
- Keep Pull Requests focused on a single feature or fix.
- Never mix unrelated changes into one Pull Request.

---

# Development Workflow

This repository follows a **GitHub Flow** based development process.

**Do not push directly to the `main` branch.**

Every contribution must go through:

1. Create a new branch.
2. Implement the change.
3. Format the modified files.
4. Run all quality checks.
5. Commit using Conventional Commits.
6. Push the branch.
7. Open a Pull Request.
8. Wait for review.
9. Address review comments if requested.
10. Merge only after approval.

---

# Branch Strategy

Never work directly on:

```text
main
```

Create a descriptive branch.

Examples:

```text
feature/ai-answer-streaming
feature/syllabus-cache
feature/dashboard-redesign

fix/sidebar-overflow
fix/search-bug

docs/update-readme
docs/contributing-guide

refactor/answer-service
refactor/cache-layer

chore/github-actions
```

---

# Clone Repository

```bash
git clone https://github.com/imuniqueshiv/HyperLearningTech.git

cd hyper-learning-tech
```

Install dependencies

```bash
npm install
```

Run locally

```bash
npm run dev
```

---

# Project Structure

```
app/
components/
lib/
hooks/
public/
styles/
types/
docs/
```

Please keep new files consistent with the existing architecture.

---

# Coding Standards

- TypeScript only
- Prefer Server Components when appropriate
- Use reusable components
- Avoid duplicated logic
- Keep functions small
- Use meaningful names
- Write self-documenting code
- Remove unused imports
- Remove dead code
- Avoid unnecessary dependencies

---

# Code Formatting

Every modified file must be formatted before committing.

Format a specific file:

```bash
npx prettier --write path/to/file
```

Format the entire project:

```bash
npx prettier --write .
```

---

# Required Quality Checks

Every Pull Request **must pass all checks**.

Run:

```bash
npm run format:check
```

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm run build
```

If any command fails, fix the issue before creating a Pull Request.

---

# Commit Message Convention

We follow **Conventional Commits**.

Examples:

```text
feat(ai): implement streaming answer generation

feat(search): add semantic syllabus search

fix(auth): resolve session refresh issue

fix(ui): correct mobile sidebar overflow

docs(readme): improve installation guide

docs(seo): add robots metadata documentation

refactor(cache): simplify cache lookup logic

perf(api): optimize answer generation latency

test(ai): add unit tests for prompt builder

chore(ci): update GitHub Actions workflow
```

Avoid messages like:

```text
update

changes

fix

new code

done

working
```

---

# Pull Request Checklist

Before opening a Pull Request:

- Branch is up to date
- Code formatted
- Lint passes
- Type checking passes
- Production build passes
- No unnecessary files
- Documentation updated if needed
- Screenshots included for UI changes

---

# Pull Request Title Examples

```text
feat(ai): add Hyper AI workspace

fix(ui): improve responsive navigation

docs: add deployment guide

refactor(api): simplify answer pipeline
```

---

# Code Review

Every Pull Request is reviewed before merging.

Reviewers may request:

- Code improvements
- Better architecture
- Documentation updates
- Additional tests
- Performance optimizations

Please respond respectfully and update your branch accordingly.

---

# Reporting Bugs

Include:

- Description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment
- Browser
- Screenshots (if applicable)

---

# Feature Requests

Describe:

- Problem
- Proposed solution
- Alternatives considered
- Expected impact

---

# Security Issues

Please do **not** report security vulnerabilities through public Issues.

Refer to `SECURITY.md` for responsible disclosure instructions.

---

# Questions

If you have questions about architecture or implementation, open a GitHub Discussion or Issue before starting large changes.

---

# Thank You

Thank you for helping improve **Hyper Learning Tech**.

Every contribution—whether documentation, bug fixes, performance improvements, accessibility enhancements, or new features—helps make the platform better for students and developers around the world.
