# Vercel guide for this project

This file is the local stand-in for indexing Vercel's docs. Read it before deploying. For routing details, open <https://vercel.com/docs/services> and <https://vercel.com/kb/guide/python-backend-on-vercel> and follow those pages if they differ from the example here.

## What gets deployed

One Vercel project serves two apps from this repository:

- `frontend/` is the public Next.js site.
- The FastAPI app in `api/index.py` is the API. Its Python dependencies are declared in the root `pyproject.toml`, so the backend service root is the repository root and the entrypoint is `api.index:app`.

FastAPI already exposes `GET /` and `POST /api/chat`. The browser should keep calling `/api/chat`. Vercel sends that path to Python and sends every other path to Next.js.

Create `vercel.json` at the repository root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "backend": {
      "root": ".",
      "framework": "fastapi",
      "entrypoint": "api.index:app"
    },
    "frontend": {
      "root": "frontend/",
      "framework": "nextjs"
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ]
}
```

Put the `/api/(.*)` rewrite first. A service receives public traffic only when a rewrite names it. Check the two official pages above before changing `root` or `entrypoint`. The backend root has to be the directory Vercel installs Python dependencies from, which in this repo is the directory that contains `pyproject.toml`.

## Environment variables

Set `OPENAI_API_KEY` in the Vercel project for Production and Preview. Vercel injects it into the Python process. `load_dotenv()` in `api/index.py` only helps on your machine, where a local `.env` file may exist. Do not commit that file, and do not mark the key as `NEXT_PUBLIC_`.

Leave `NEXT_PUBLIC_API_URL` unset on Vercel so the site calls same-origin `/api/chat`. Set it to `http://127.0.0.1:8000` only in `frontend/.env.local` for `npm run dev`.

## Commands

From the repository root, after the frontend exists:

```bash
npm install -g vercel
vercel
```

`vercel` without flags uploads a preview. `vercel deploy --prod` updates the production deployment. The link to share is the project's production domain, the one listed as the domain in the Vercel dashboard. Open that domain in a private window to confirm it is public. Deployment Protection can make a preview URL look broken while logged out. That is separate from the production domain.

To run both services with the same routing as the deployment, use `vercel dev` from the repository root. Plain `npm run dev` only starts Next.js, so the API still needs `uv run uvicorn api.index:app --reload` in another terminal.
