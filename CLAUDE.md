# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

This is the **AI Engineer Challenge**, a teaching sample for the AI Engineer Bootcamp. It is intentionally small and "vibe-coded": a thin FastAPI wrapper around the OpenAI API, paired with a Next.js frontend. The backend's system prompt casts it as a supportive "mental coach" chatbot — that persona is deliberate and should be preserved unless the user asks to change it.

The project was originally authored for Cursor. **`.cursor/rules/*.mdc`** still govern how this repo should be worked on and take precedence over this file's own conventions where they overlap:

- `general-rule.mdc` — always applies: commit after code changes, write documented code, work one feature at a time, explain decisions.
- `frontend-rule.mdc` — contrast/UX requirements, password fields for sensitive input, must run locally and on Vercel.
- `nextjs-rule.mdc` — read `docs/nextjs.md` before touching `frontend/`; defines the `/api/chat` contract.
- `vercel-rule.mdc` — read `docs/vercel.md` before touching deployment/`vercel.json`.
- `readme-rule.mdc` — READMEs should be fun and approachable but technically accurate.

`docs/nextjs.md` and `docs/vercel.md` are local stand-ins for the official Next.js and Vercel docs (Cursor's old "index custom docs" feature no longer exists). Read them before frontend or deployment work; open the real nextjs.org/vercel.com docs for anything they don't cover.

> Note on the project's own git history: `general-rule.mdc` says to always commit after updating code. The harness's own safety rules take priority — never commit without the user's explicit go-ahead in this session, even though the project rule says otherwise.

## Repository structure

```
api/index.py         FastAPI backend — the only backend file
api/README.md        Backend-specific setup/usage notes
frontend/             Next.js app (App Router)
  app/page.tsx         Home page, renders <Chat />
  app/chat.tsx          Chat form + transcript, client component
  app/layout.tsx        Root layout, page metadata
  app/globals.css       All styling (no CSS framework)
  lib/api.ts            getApiBase() + sendMessage(), the only place that calls the backend
docs/nextjs.md        Local Next.js reference
docs/vercel.md        Local Vercel deployment reference (the authority on vercel.json)
vercel.json           Two-service Vercel config (see Deployment below)
pyproject.toml        Backend deps, managed by uv; project name is "beyond-chatgpt"
```

## Common commands

Backend (from repo root, `uv`-managed, Python 3.12):

```bash
uv sync                                        # install/create .venv
export OPENAI_API_KEY=sk-...                   # required — see Gotchas
uv run uvicorn api.index:app --reload          # serves http://localhost:8000
```

Frontend (from `frontend/`):

```bash
npm install
npm run dev     # http://localhost:3000, defaults to calling http://127.0.0.1:8000
npm run build   # production build — also the quickest type-check
npm run start   # serve the production build
```

Run both together for local end-to-end testing; see `frontend/README.md`.

## Architecture / API contract

One contract, defined in `.cursor/rules/nextjs-rule.mdc` and implemented in `api/index.py` + `frontend/lib/api.ts`:

- `POST /api/chat` with body `{ "message": string }`
- Success: `{ "reply": string }`
- Failure: non-2xx with `{ "detail": string }`

`frontend/lib/api.ts` is the single chokepoint for this call — `getApiBase()` decides the host:
- `NEXT_PUBLIC_API_URL=""` (set) forces same-origin `/api/chat`.
- Unset in `development` → falls back to `http://127.0.0.1:8000`.
- Unset otherwise (production) → same-origin `/api/chat`.

`OPENAI_API_KEY` must only ever be read server-side (`api/index.py`). Never move it into a `NEXT_PUBLIC_*` variable or into any client component.

## Deployment (Vercel)

`vercel.json` declares two services in one project — read `docs/vercel.md` before changing this:

- `backend`: root `.` (where `pyproject.toml` lives), framework `fastapi`, entrypoint `api.index:app`.
- `frontend`: root `frontend/`, framework `nextjs`.

Rewrites, in this order (order matters — the catch-all must come last):
```json
{ "source": "/api/(.*)", "destination": { "service": "backend" } },
{ "source": "/(.*)", "destination": { "service": "frontend" } }
```
A service gets no public traffic unless a rewrite names it. Set `OPENAI_API_KEY` in the Vercel project (Production + Preview); leave `NEXT_PUBLIC_API_URL` unset there.

## Conventions

- Frontend has no CSS framework — all styling lives in `frontend/app/globals.css` using CSS custom properties (`--ink`, `--paper`, etc.). Keep new styles consistent with that palette rather than introducing a new system.
- Keep `frontend/lib/api.ts` as the only module that calls the backend; don't add ad hoc `fetch` calls elsewhere in the frontend.
- The backend is a single file (`api/index.py`) by design for this teaching app — don't split it into multiple modules unless the user asks for that restructuring.

## Known gotchas

- **`api/index.py` builds the OpenAI client at import time** (`client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))`). If `OPENAI_API_KEY` is unset, the SDK raises during import and the server never starts — the `if not os.getenv("OPENAI_API_KEY"): raise HTTPException(...)` check inside the `/api/chat` handler is currently dead code, since that path can't be reached without the key already being present. Always export a real `OPENAI_API_KEY` before starting the backend.
- `api/README.md` documents a `GET /api/health` endpoint; it does not currently exist in `api/index.py` (only `GET /` and `POST /api/chat` do). Treat the README as aspirational on that point until the route is added or the doc is corrected.
- `next dev` (Next.js 16/Turbopack) auto-generates `frontend/AGENTS.md` on every run. That's expected — per its own header comment, committing it keeps the tree clean; don't delete it as cleanup.
