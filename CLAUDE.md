# CLAUDE.md

This file provides guidance to AI agents working on this codebase.

## Project Overview

{PROJECT_NAME} is {brief description}. It uses {stack: e.g., Next.js, TypeScript, PostgreSQL}.

## 📋 Phase Status

| Phase | Status | Branch | Description |
|-------|--------|--------|-------------|
| Phase 1: {Name} | ⬜ Planned | TBD | {description} |
| Phase 2: {Name} | ⬜ Planned | TBD | {description} |

**Current work**: {what's actively being built}

## 📚 Documentation

All specs and design docs are in `docs/`. Read the relevant spec before implementing.

| Doc | Purpose |
|-----|---------|
| `docs/{epic}.md` | Master epic — full vision, architecture decisions |
| `docs/{phase-spec}.md` | Current phase spec — schema, functions, requirements |
| `docs/dev/{stack}_rules.txt` | Stack-specific coding patterns and rules |

## ⚠️ Architecture Rules

<!-- Hard constraints. Things that break if violated. -->

1. {Rule 1 — e.g., "Never call external APIs from database functions"}
2. {Rule 2 — e.g., "All browser-only SDKs must be lazy-loaded"}
3. {Rule 3}

## Commands

```bash
{package_manager} dev        # Start dev server
{package_manager} run build  # Production build
{package_manager} run lint   # Lint
{package_manager} test       # Run tests
```

Package manager: **{npm/yarn/pnpm/bun}**

## Architecture

### Key Directories

```
src/
  ├── {dir}/     — {purpose}
  ├── {dir}/     — {purpose}
  └── {dir}/     — {purpose}
```

### Patterns

- {Pattern 1 — e.g., "Client components use 'use client' directive"}
- {Pattern 2 — e.g., "All API routes validate input with zod"}
- {Pattern 3}

## Environment Variables

| Variable | Where | Purpose | Status |
|----------|-------|---------|--------|
| `{VAR_NAME}` | {.env.local / CI} | {purpose} | ⬜ |

## Patterns That Work

<!-- Add patterns discovered during development. Help the next agent. -->

## ⚠️ Known Issues & Warnings

<!-- Document gotchas so the next agent doesn't repeat them. -->

## Last Commit Log

### Latest

| Field | Value |
|-------|-------|
| **Date** | {date} |
| **Commit** | `{hash}` |
| **Branch** | `{branch}` |
| **What** | {one-line summary} |
| **Status** | {✅ Build passes / ❌ Issues} |
