# Matchbook - Agent Instructions

## Overview
Matchbook is a personal place-saving app. Paste Google Maps links to save places, organize them into collections with colored pins. See `docs/prd.md` for full product details.

## User Context
- Single user building this for fun and learning
- Knows HTML/CSS, learning React/Next.js
- Primary device: Android
- Prefers incremental "vibe coding" - small steps, test often, commit frequently

## Working on Tasks

### Finding the Next Task
When asked to work on the next task or continue development:
1. **Read `docs/roadmap.md`** to find the first unchecked `[ ]` item
2. **Read `docs/progress.txt`** for context on what was done and any blockers
3. Start working on that task

### Before Starting Any Task
1. **Invoke required skills**:
   - `/vercel-react-best-practices` - React/Next.js performance patterns
   - `/frontend-design` - Distinctive, production-grade UI design
2. **Define Clear Acceptance Criteria** - Before writing any code, list specific, testable criteria that define "done"

### After Completing Any Task
1. **Update `docs/roadmap.md`** - Change `[ ]` to `[x]` for completed items
2. **Update `docs/progress.txt`** - Log what was done, decisions made, any issues
3. **Commit the changes** if the user requests it

## Progress Tracking

**File**: `docs/progress.txt`

This file serves as persistent memory across sessions to prevent context rot and avoid repeating mistakes.

### When to Read
- At the start of each new task or session
- Before starting any roadmap step
- When encountering an error (check if it was already encountered)

### When to Update
- After completing each roadmap step
- When encountering a blocker or failed approach
- When making significant decisions

### What to Record
1. **Completed tasks**: Mark roadmap items done with commit refs
2. **Decisions made**: Document architectural choices and why
3. **Blockers encountered**: What went wrong and attempted solutions
4. **Failed approaches**: What didn't work and why (critical for avoiding repeated mistakes)
