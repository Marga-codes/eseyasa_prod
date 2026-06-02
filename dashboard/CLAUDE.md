# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

This directory is the **dashboard** subproject of the larger `eseyasa_prod` repo. The parent directory (`..`) is a separate static HTML/CSS/JS site (Eseyasa Productions) served as plain files; this dashboard is its admin backend built on Next.js. Changes to the static site live in the parent; changes to the API and admin UI live here.

## Commands

All commands run from `dashboard/`.

- `npm run dev` — Next dev server on **port 3001** using the `DATABASE_URL` from `.env` (Postgres).
- `npm run dev:sqlite` — same, but overrides `DATABASE_URL` to a local SQLite file (`prisma/dev.db`). Use this for offline work.
- `npm run build` / `npm start` — production build / serve on port 3001.
- `npm run prisma:generate:sqlite` — generate the Prisma client against the SQLite schema (`prisma/schema.sqlite.prisma`).
- `npm run prisma:dbpush:sqlite` — apply the SQLite schema to `prisma/dev.db`.
- `npx prisma generate` / `npx prisma db push` — same for the default Postgres schema (`prisma/schema.prisma`).

There is no test suite, lint config, or formatter wired into npm scripts.

## Architecture

**Stack**: Next.js 13.4.5 (Pages Router, not App Router), React 18, Prisma 5, nodemailer, TypeScript (with `strict: false`).

**Dual Prisma schemas** — this is the key non-obvious thing:
- `prisma/schema.prisma` is the Postgres production schema. `Artist.links` is `Json?`.
- `prisma/schema.sqlite.prisma` is the local-dev SQLite schema. `Artist.links` is `String?` (SQLite has no JSON type). Switching requires regenerating the client with the matching `--schema` flag.

**API surface** (Pages Router under `pages/api/`):
- `GET /api/artists`, `POST /api/artists` (admin), and `GET/PUT/DELETE /api/artists/[id]` (admin) — Prisma CRUD on the `Artist` model.
- `POST /api/contact` — sends booking/contact email via SMTP (nodemailer); recipient is the `SMTP_USER` account itself.

**Admin auth** is a single shared password compared against `ADMIN_PASSWORD` via the `x-admin-password` request header — checked inline in each mutating handler (`checkAdmin` in `pages/api/artists/*.ts`). There is no session, no user table, no JWT. The same value is typed into the `pw` state on the dashboard page (`pages/index.tsx`). Treat this as the threat model when adding routes that mutate data.

**Prisma client** is a singleton cached on `global.prisma` in dev to survive HMR (`lib/prisma.ts`). Import as `prisma from '../../../lib/prisma'`.

## Deployment

`.github/workflows/deploy-vercel.yml` (in the parent repo) builds and deploys this dashboard to Vercel on push to `main`. It injects `DATABASE_URL`, `SMTP_*`, and `ADMIN_PASSWORD` from GitHub Secrets. The `vercel.json` here currently has a catch-all route to `/index.html` left over from the static site — be careful editing it, it likely needs to be removed or reworked for the Next.js app to route correctly in production.

## UI language

UI strings and the admin dashboard are in **Spanish** ("Crear artista", "Eliminar", "Contacto / Booking"). Keep new user-facing copy in Spanish to match.
