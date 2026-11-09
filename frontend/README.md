# Front end

This is the chat page for the mental coach. It is a Next.js app, and it talks to the FastAPI backend already living in `api/`. Your message goes to `POST /api/chat`. The OpenAI key never lands in the browser.

## Run it locally

You want two terminals, both starting from the repository root.

Start the API first:

```bash
uv run uvicorn api.index:app --reload
```

That listens on `http://127.0.0.1:8000`. Then start the site:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The page calls `http://127.0.0.1:8000` during local development. To point it somewhere else, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

On Vercel, leave that variable unset. The page then calls same-origin `/api/chat`.
